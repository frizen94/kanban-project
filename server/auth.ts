import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage as appStorage } from "./db-storage";
import { User as UserType } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configuração da sessão
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "kanban-board-secret-key",
    resave: false,
    saveUninitialized: false,
    store: appStorage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configuração do LocalStrategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await appStorage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Usuário não encontrado" });
        }
        
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return done(null, false, { message: "Senha incorreta" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialização e deserialização do usuário
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await appStorage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Rotas de autenticação
  app.post("/api/register", async (req, res) => {
    try {
      // Verificar se está autenticado e é admin (exceto pela primeira criação)
      const totalUsers = await appStorage.getUserCount();
      const isFirstUser = totalUsers === 0;
      
      if (!isFirstUser && (!req.isAuthenticated() || req.user.role.toLowerCase() !== "admin")) {
        return res.status(403).json({ 
          message: "Permissão negada. Apenas administradores podem cadastrar novos usuários." 
        });
      }

      const existingUser = await appStorage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      // Define papel do usuário
      let role = req.body.role || "user";
      
      // O primeiro usuário sempre será admin
      if (isFirstUser) {
        role = "ADMIN";
      } 
      // Garante que apenas admins podem criar outros admins
      else if (role.toUpperCase() === "ADMIN" && (!req.isAuthenticated() || req.user.role.toUpperCase() !== "ADMIN")) {
        role = "user";
      }
      
      const user = await appStorage.createUser({
        ...req.body,
        password: hashedPassword,
        role
      });

      // Remove a senha antes de enviar a resposta
      const { password, ...userWithoutPassword } = user;
      
      // Apenas faz login automático se for o primeiro usuário
      if (isFirstUser) {
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Erro ao fazer login após registro" });
          }
          return res.status(201).json(userWithoutPassword);
        });
      } else {
        return res.status(201).json(userWithoutPassword);
      }
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ message: "Erro ao registrar usuário" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: UserType) => {
      if (err) {
        return res.status(500).json({ message: "Erro de autenticação" });
      }
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login" });
        }
        
        // Remove a senha antes de enviar a resposta
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.status(200).json({ message: "Logout bem-sucedido" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Remove a senha antes de enviar a resposta
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}