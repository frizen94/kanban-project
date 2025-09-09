import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Board as BoardComponent } from "@/components/board";
import { BoardHeader } from "@/components/board-header";
import { BoardOverview } from "@/components/board-overview";
import { useBoardContext } from "@/lib/board-context";
import type { Board, List } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = parseInt(id);
  const { currentBoard, fetchBoardData, isLoading } = useBoardContext();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'overview' | 'board'>('overview');

  useEffect(() => {
    if (isNaN(boardId)) {
      toast({
        title: "Invalid Board ID",
        description: "The board ID is not valid.",
        variant: "destructive",
      });
      return;
    }

    fetchBoardData(boardId).catch((error) => {
      console.error("Error fetching board data:", error);
      toast({
        title: "Error",
        description: "Failed to load board data. Please try again.",
        variant: "destructive",
      });
    });
  }, [boardId]);

  const handleBoardUpdate = (updatedBoard: Board) => {
    // The board update will be handled by refetching data
    fetchBoardData(boardId);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] flex flex-col">
      {isLoading ? (
        <LoadingState />
      ) : !currentBoard ? (
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Board not found</h2>
            <p className="text-gray-500 mb-6">
              The board you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </div>
      ) : (
        <>
          <BoardHeader
            board={currentBoard}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
          {currentView === 'overview' ? (
            <BoardOverview
              board={currentBoard}
              onBoardUpdate={handleBoardUpdate}
            />
          ) : (
            <BoardComponent boardId={parseInt(id || "0")} />
          )}
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="bg-[#0079BF]/90 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between">
            <Skeleton className="h-8 w-48 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex space-x-4 overflow-x-auto">
          <Skeleton className="h-[300px] w-[272px] rounded-md bg-gray-200" />
          <Skeleton className="h-[300px] w-[272px] rounded-md bg-gray-200" />
          <Skeleton className="h-[300px] w-[272px] rounded-md bg-gray-200" />
        </div>
      </div>
    </>
  );
}