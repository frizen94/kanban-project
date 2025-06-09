import { useState, useEffect, useRef, FormEvent } from "react";
import { Checklist, ChecklistItem, User } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Edit2, Calendar, User as UserIcon, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChecklistManagerProps {
  cardId: number;
}

export function ChecklistManager({ cardId }: ChecklistManagerProps) {
  const {
    checklists,
    checklistItems,
    fetchChecklists,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    fetchChecklistItems,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem
  } = useBoardContext();

  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemContents, setNewItemContents] = useState<{ [checklistId: number]: string }>({});
  const [editMode, setEditMode] = useState<{ [checklistId: number]: boolean }>({});
  const [editTitles, setEditTitles] = useState<{ [checklistId: number]: string }>({});

  // Novo estado para edição de itens
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemContent, setEditingItemContent] = useState("");
  const [itemAssignees, setItemAssignees] = useState<{ [itemId: number]: User | null }>({});
  const [itemDueDates, setItemDueDates] = useState<{ [itemId: number]: Date | null }>({});
  const [users, setUsers] = useState<User[]>([]);

  // Estado para controlar popups de atribuição e data
  const [openDatePickerId, setOpenDatePickerId] = useState<number | null>(null);
  const [openMemberPickerId, setOpenMemberPickerId] = useState<number | null>(null);

  // Referência para o formulário de edição de item
  const editItemInputRef = useRef<HTMLInputElement>(null);



  // Função para buscar usuários do sistema
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Falha ao buscar usuários');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    if (cardId) {
      fetchChecklists(cardId).then((fetchedChecklists) => {
        // Fetch items for each checklist
        fetchedChecklists.forEach(checklist => {
          fetchChecklistItems(checklist.id);
          // Initialize new item content state for this checklist
          setNewItemContents(prev => ({ ...prev, [checklist.id]: "" }));
        });
      });

      // Buscar usuários para a atribuição de tarefas
      fetchUsers();
    }
  }, [cardId]);

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;

    try {
      await createChecklist(newChecklistTitle, cardId);
      setNewChecklistTitle("");
    } catch (error) {
      console.error("Erro ao criar checklist:", error);
    }
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    try {
      await deleteChecklist(checklistId);
    } catch (error) {
      console.error("Erro ao excluir checklist:", error);
    }
  };

  const handleCreateItem = async (checklistId: number) => {
    const content = newItemContents[checklistId];
    if (!content.trim()) return;

    try {
      await createChecklistItem(content, checklistId);
      setNewItemContents(prev => ({ ...prev, [checklistId]: "" }));
    } catch (error) {
      console.error("Erro ao criar item:", error);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    try {
      await updateChecklistItem(item.id, { completed: !item.completed });
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  const handleDeleteItem = async (itemId: number, checklistId: number) => {
    try {
      await deleteChecklistItem(itemId, checklistId);
    } catch (error) {
      console.error("Erro ao excluir item:", error);
    }
  };

  // Função para iniciar a edição de um item
  const startEditingItem = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingItemContent(item.content);

    // Foco no input após renderização
    setTimeout(() => {
      if (editItemInputRef.current) {
        editItemInputRef.current.focus();
      }
    }, 0);
  };

  // Função para salvar a edição de um item
  const saveItemEdit = async (itemId: number, checklistId: number) => {
    if (!editingItemContent.trim()) return;

    try {
      await updateChecklistItem(itemId, { content: editingItemContent });
      setEditingItemId(null);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  // Função para cancelar a edição de um item
  const cancelItemEdit = () => {
    setEditingItemId(null);
    setEditingItemContent("");
  };

  // Função para verificar se um item está atrasado
  const isItemOverdue = (dueDate: string | Date | null): boolean => {
    if (!dueDate) return false;

    // Criar uma data com apenas ano, mês e dia (sem horas)
    const dueDateObj = new Date(dueDate);
    const today = new Date();

    // Remove a parte de tempo para comparar apenas as datas
    const dueDateTime = new Date(
      dueDateObj.getFullYear(), 
      dueDateObj.getMonth(), 
      dueDateObj.getDate()
    ).getTime();

    const todayTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();

    return dueDateTime < todayTime;
  };

  // Função para formatar a data sem o problema de fuso horário
  const formatDateBR = (date: string | Date): string => {
    if (!date) return '';

    const dateObj = new Date(date);
    // Usar UTC para evitar problemas de fuso horário
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  // Função para atribuir um membro ao item
  const assignMemberToItem = async (itemId: number, userId: number | null) => {
    try {
      await updateChecklistItem(itemId, { assignedToUserId: userId });
      setItemAssignees(prev => ({ ...prev, [itemId]: null })); // Resetar o estado local
    } catch (error) {
      console.error("Erro ao atribuir membro ao item:", error);
    }
  };

  // Função para definir prazo para um item
  const setItemDueDate = async (itemId: number, date: Date | null) => {
    try {
      // Se a data for nula, removemos o prazo
      if (date === null) {
        await updateChecklistItem(itemId, { dueDate: null });
      } else {
        // Garantir que a data está em UTC para evitar problemas de fuso horário
        const utcDate = new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ));

        await updateChecklistItem(itemId, { dueDate: utcDate });
      }

      setItemDueDates(prev => ({ ...prev, [itemId]: null })); // Resetar o estado local
    } catch (error) {
      console.error("Erro ao definir prazo para o item:", error);
    }
  };

  const startEditingTitle = (checklist: Checklist) => {
    setEditMode(prev => ({ ...prev, [checklist.id]: true }));
    setEditTitles(prev => ({ ...prev, [checklist.id]: checklist.title }));
  };

  const saveChecklistTitle = async (checklistId: number) => {
    const newTitle = editTitles[checklistId];
    if (!newTitle.trim()) return;

    try {
      await updateChecklist(checklistId, { title: newTitle });
      setEditMode(prev => ({ ...prev, [checklistId]: false }));
    } catch (error) {
      console.error("Erro ao atualizar título da checklist:", error);
    }
  };

  const calculateProgress = (checklistId: number): number => {
    const items = checklistItems[checklistId] || [];
    if (items.length === 0) return 0;

    const completedCount = items.filter(item => item.completed).length;
    return Math.round((completedCount / items.length) * 100);
  };



  const cardChecklists = checklists[cardId] || [];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Checklists</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Input
            placeholder="Título da checklist"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            className="w-48"
          />
          <Button size="sm" onClick={handleCreateChecklist}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Checklist
          </Button>
        </div>
      </div>

      {cardChecklists.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Nenhuma checklist adicionada. Crie uma nova checklist para começar.
        </div>
      ) : (
        <div className="space-y-4">
          {cardChecklists.map(checklist => {
            const items = checklistItems[checklist.id] || [];
            const progress = calculateProgress(checklist.id);

            return (
              <Card key={checklist.id} className="border shadow-sm">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    {editMode[checklist.id] ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editTitles[checklist.id] || ""}
                          onChange={(e) => setEditTitles(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                          className="h-8"
                        />
                        <Button size="sm" variant="outline" onClick={() => saveChecklistTitle(checklist.id)}>
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditMode(prev => ({ ...prev, [checklist.id]: false }))}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-base font-medium">{checklist.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEditingTitle(checklist)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Checklist</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso irá excluir permanentemente a checklist e todos os seus itens.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteChecklist(checklist.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ul className="space-y-2">
                    {items.map(item => (
                      <li key={item.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={item.completed} 
                            onCheckedChange={() => handleToggleItem(item)}
                            id={`item-${item.id}`}
                          />

                          {editingItemId === item.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                ref={editItemInputRef}
                                value={editingItemContent}
                                onChange={(e) => setEditingItemContent(e.target.value)}
                                className="h-8 flex-1"
                              />
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => saveItemEdit(item.id, checklist.id)}
                              >
                                Salvar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={cancelItemEdit}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <>
                              <label 
                                htmlFor={`item-${item.id}`}
                                className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                              >
                                {item.content}
                              </label>

                              <div className="flex items-center gap-1">
                                {/* Botão de atribuir membro */}
                                <Popover open={openMemberPickerId === item.id} onOpenChange={(open) => !open && setOpenMemberPickerId(null)}>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant={item.assignedToUserId ? "outline" : "ghost"}
                                      className={`h-7 w-7 ${item.assignedToUserId ? "border-blue-400" : ""}`}
                                      onClick={() => setOpenMemberPickerId(item.id)}
                                    >
                                      <UserIcon className={`h-3 w-3 ${item.assignedToUserId ? "text-blue-500" : "text-muted-foreground"}`} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-52 p-2">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium mb-1">Atribuir membro</h4>
                                      <div className="space-y-1">
                                        {users.map(user => (
                                          <div 
                                            key={user.id} 
                                            className={`flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm cursor-pointer ${item.assignedToUserId === user.id ? "bg-blue-50" : ""}`}
                                            onClick={() => {
                                              assignMemberToItem(item.id, user.id === item.assignedToUserId ? null : user.id);
                                              setOpenMemberPickerId(null);
                                            }}
                                          >
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback className="text-xs">
                                                {user.name?.charAt(0) || user.username.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{user.name || user.username}</span>
                                          </div>
                                        ))}

                                        {item.assignedToUserId && (
                                          <div 
                                            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted text-sm cursor-pointer text-muted-foreground"
                                            onClick={() => {
                                              assignMemberToItem(item.id, null);
                                              setOpenMemberPickerId(null);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Remover atribuição</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {/* Botão de definir prazo */}
                                <Popover open={openDatePickerId === item.id} onOpenChange={(open) => !open && setOpenDatePickerId(null)}>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant={item.dueDate ? "outline" : "ghost"}
                                      className={`h-7 w-7 ${item.dueDate ? "border-green-400" : ""}`}
                                      onClick={() => setOpenDatePickerId(item.id)}
                                    >
                                      <Calendar className={`h-3 w-3 ${item.dueDate ? "text-green-500" : "text-muted-foreground"}`} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium mb-1">Definir prazo</h4>
                                      <div className="space-y-2">
                                        <Input
                                            type="date"
                                            value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                              if (!e.target.value) {
                                                setItemDueDate(item.id, null);
                                                return;
                                              }

                                              const date = new Date(e.target.value + 'T12:00:00');
                                              setItemDueDate(item.id, date);
                                            }}
                                            className="w-full"
                                        />

                                        {item.dueDate && (
                                          <Button 
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-destructive"
                                            onClick={() => {
                                              setItemDueDate(item.id, null);
                                              setOpenDatePickerId(null);
                                            }}
                                          >
                                            Remover prazo
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {/* Menu de ações */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-7 w-7"
                                    >
                                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem onClick={() => startEditingItem(item)}>
                                      <Edit2 className="h-3.5 w-3.5 mr-2" />
                                      <span>Editar</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteItem(item.id, checklist.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      <span>Excluir</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Informações adicionais do item */}
                        {!editingItemId && (item.assignedToUserId || item.dueDate) && (
                          <div className="pl-8 flex items-center gap-2 text-xs text-muted-foreground">
                            {item.assignedToUserId && users.find(u => u.id === item.assignedToUserId) && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                <span>
                                  {users.find(u => u.id === item.assignedToUserId)?.name || 
                                   users.find(u => u.id === item.assignedToUserId)?.username}
                                </span>
                              </div>
                            )}

                            {item.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className={item.dueDate && isItemOverdue(item.dueDate) && !item.completed ? "text-red-500 font-medium" : ""}>
                                  {item.dueDate && formatDateBR(item.dueDate)}
                                  {item.dueDate && isItemOverdue(item.dueDate) && !item.completed && " (Atrasado)"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      placeholder="Adicionar item"
                      value={newItemContents[checklist.id] || ""}
                      onChange={(e) => setNewItemContents(prev => ({ 
                        ...prev, 
                        [checklist.id]: e.target.value 
                      }))}
                      className="h-8"
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleCreateItem(checklist.id)}
                      className="whitespace-nowrap"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}