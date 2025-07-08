import { CollectionMember, CollectionWithDetails } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';
import { UserService } from '@/services/UserService';
import { useUser } from '@/context/UserContext';


export interface CollectionDetailData {
  id: string;
  name: string;
  description?: string;
  members: number;
  maxMembers: number;
  startingBalance: string;
  totalValue: number;
  avgPnl: number;
  status: string;
  startDate: string;
  endDate?: string;
  inviteCode: string;
  isPublic: boolean;
  allowInvites: boolean;
  owner?: {
    username: string;
    displayName?: string;
  };
}

export interface CollectionMemberData {
  id: string;
  username: string;
  displayName: string;
  balance: string;
  totalPnl: string;
  rank: number;
  joinedAt: string;
  role: string;
  totalTrades: number;
  winRate: number;
}

export function useCollectionDetail(collectionId: string) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionDetailData | null>(null);
  const [members, setMembers] = useState<CollectionMemberData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const fetchCollectionData = useCallback(async () => {
    if (!collectionId || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Fetching collection data for ID: ${collectionId}`);

      // Fetch collection details
      const collectionData = await UserService.getCollectionById(collectionId);
      
      if (collectionData) {
        const processedCollection: CollectionDetailData = {
          id: collectionData.id,
          name: collectionData.name,
          description: collectionData.description,
          members: collectionData.member_count || 0,
          maxMembers: collectionData.max_members || 50,
          startingBalance: collectionData.starting_balance || "100000",
          totalValue: parseFloat(collectionData.total_volume || "0"),
          avgPnl: parseFloat(collectionData.avg_pnl || "0"),
          status: collectionData.status || "ACTIVE",
          startDate: collectionData.start_date || new Date().toISOString(),
          endDate: collectionData.end_date,
          inviteCode: collectionData.invite_code || "",
          isPublic: collectionData.is_public || true,
          allowInvites: collectionData.allow_invites || true,
          owner: collectionData.users ? {
            username: collectionData.users.username,
            displayName: collectionData.users.display_name,
          } : undefined,
        };

        setCollection(processedCollection);

        // Process members if available
        if (collectionData.collection_members && Array.isArray(collectionData.collection_members)) {
          const processedMembers: CollectionMemberData[] = collectionData.collection_members.map((member: any) => ({
            id: member.id,
            username: member.users?.username || "unknown",
            displayName: member.users?.display_name || member.users?.username || "Unknown User",
            balance: member.current_balance || member.starting_balance || "0",
            totalPnl: member.total_pnl || "0",
            rank: member.rank || 0,
            joinedAt: member.joined_at || member.created_at || new Date().toISOString(),
            role: member.role || "MEMBER",
            totalTrades: member.total_trades || 0,
            winRate: parseFloat(member.win_rate || "0"),
          }));

          // Sort by rank (if available) or by total P&L
          processedMembers.sort((a, b) => {
            if (a.rank && b.rank) return a.rank - b.rank;
            if (a.rank) return -1;
            if (b.rank) return 1;
            return parseFloat(b.totalPnl) - parseFloat(a.totalPnl);
          });

          setMembers(processedMembers);
        } else {
          // If no members found, ensure owner is displayed
          console.log("⚠️ No members found in collection data, owner should be displayed");
        }

        setLastSyncTime(new Date());
        console.log("✅ Collection detail data loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching collection detail:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch collection details"
      );
    } finally {
      setLoading(false);
    }
  }, [collectionId, user?.id]);

  const fetchMembers = useCallback(async () => {
    if (!collectionId) return;

    try {
      console.log(`🔄 Fetching members for collection: ${collectionId}`);
      const membersData = await UserService.getCollectionMembers(collectionId);
      
      const processedMembers: CollectionMemberData[] = membersData.map((member: any) => ({
        id: member.id,
        username: member.users?.username || "unknown",
        displayName: member.users?.display_name || member.users?.username || "Unknown User",
        balance: member.current_balance || member.starting_balance || "0",
        totalPnl: member.total_pnl || "0",
        rank: member.rank || 0,
        joinedAt: member.joined_at || member.created_at || new Date().toISOString(),
        role: member.role || "MEMBER",
        totalTrades: member.total_trades || 0,
        winRate: parseFloat(member.win_rate || "0"),
      }));

      // Sort by rank (if available) or by total P&L
      processedMembers.sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        if (a.rank) return -1;
        if (b.rank) return 1;
        return parseFloat(b.totalPnl) - parseFloat(a.totalPnl);
      });

      setMembers(processedMembers);
      console.log("✅ Collection members loaded successfully");
    } catch (error) {
      console.error("Error fetching collection members:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch members"
      );
    }
  }, [collectionId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCollectionData();
      await fetchMembers();
      console.log("✅ Collection detail refreshed successfully");
    } catch (error) {
      console.error("Error refreshing collection detail:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCollectionData, fetchMembers]);

  // Auto-refresh every 30 seconds if the screen is active
  useEffect(() => {
    if (!collectionId || !user?.id) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing collection data...");
      fetchCollectionData();
      fetchMembers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [collectionId, user?.id, fetchCollectionData, fetchMembers]);

  // Load data on mount
  useEffect(() => {
    if (collectionId && user?.id) {
      fetchCollectionData();
    }
  }, [collectionId, user?.id, fetchCollectionData]);

  return {
    collection,
    members,
    loading,
    refreshing,
    error,
    lastSyncTime,
    onRefresh,
    fetchCollectionData,
    fetchMembers,
  };
} 