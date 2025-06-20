import { useState, useCallback, useEffect } from "react";
import { StudentActionType } from "@/types/student-actions";

export interface ActionHistoryItem {
  id: string;
  actionType: StudentActionType;
  studentId: string;
  studentName: string;
  timestamp: string;
  details: any;
  status: 'completed' | 'failed' | 'pending';
}

interface ActionHistoryFilters {
  actionType?: StudentActionType;
  studentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface UseActionHistoryProps {
  lectureId: string;
  initialFilters?: ActionHistoryFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseActionHistoryReturn {
  actions: ActionHistoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchActions: (filters?: ActionHistoryFilters) => Promise<void>;
  clearHistory: () => void;
  filters: ActionHistoryFilters;
  setFilters: (filters: ActionHistoryFilters) => void;
}

export function useActionHistory({
  lectureId,
  initialFilters = {},
  autoRefresh = false,
  refreshInterval = 30000
}: UseActionHistoryProps): UseActionHistoryReturn {
  const [actions, setActions] = useState<ActionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActionHistoryFilters>(initialFilters);
  
  const buildQueryString = (filters: ActionHistoryFilters): string => {
    const params = new URLSearchParams();
    
    if (filters.actionType) {
      params.append('actionType', filters.actionType);
    }
    
    if (filters.studentId) {
      params.append('studentId', filters.studentId);
    }
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    
    return params.toString();
  };
  
  const fetchActions = useCallback(async (overrideFilters?: ActionHistoryFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const activeFilters = overrideFilters || filters;
      const queryString = buildQueryString(activeFilters);
      const url = `/api/lectures/${lectureId}/actions/history${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch action history: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setActions(data);
    } catch (err) {
      console.error('Error fetching action history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch action history');
    } finally {
      setIsLoading(false);
    }
  }, [lectureId, filters]);
  
  const clearHistory = useCallback(() => {
    setActions([]);
  }, []);
  
  // Initialize fetch
  useEffect(() => {
    fetchActions();
  }, [fetchActions]);
  
  // Set up auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchActions();
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval, fetchActions]);
  
  return {
    actions,
    isLoading,
    error,
    fetchActions,
    clearHistory,
    filters,
    setFilters
  };
} 