import { createCollection, fetchCollections } from "@/features/userSlice";
import { RootState } from "@/store";
import { useAppDispatch } from "@/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserService } from "@/services/UserService";
import { useSelector } from "react-redux";
import { useUser } from "@/context/UserContext";
import {
  Collection,
  CollectionWithDetails,
  CreateCollectionParams,
} from "@/types/database";

export interface CollectionData {
  id: string;
  name: string;
  description?: string;
  members: number;
  isPublic: boolean;
  totalValue: number;
  rank?: number;
  owner?: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate?: string;
  avgPnl: number;
  memberCount: number;
  isOwner: boolean;
  isMember: boolean;
}

export function useCollectionsData() {
  const dispatch = useAppDispatch();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get collections from Redux store
  const collections = useSelector((state: RootState) => state.user.collections);
  const userLoading = useSelector((state: RootState) => state.user.loading);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch collections from cloud
      await dispatch(fetchCollections(user.id)).unwrap();

      console.log("✅ Collections data loaded successfully");
    } catch (error) {
      console.error("Error fetching collections:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch collections"
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
      console.log("✅ Collections refreshed successfully");
    } catch (error) {
      console.error("Error refreshing collections:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // Force refresh function for external triggers
  const forceRefresh = useCallback(async () => {
    console.log("🔄 Force refreshing collections data");
    setRefreshing(true);
    setError(null);
    try {
      if (user?.id) {
        await dispatch(fetchCollections(user.id)).unwrap();
        console.log("✅ Collections force refreshed successfully");
      }
    } catch (error) {
      console.error("Error force refreshing collections:", error);
      setError(
        error instanceof Error ? error.message : "Failed to refresh collections"
      );
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, user?.id]);

  // Process collections data for UI
  const processedData = useMemo(() => {
    if (
      !collections ||
      !Array.isArray(collections) ||
      collections.length === 0
    ) {
      return {
        myCollections: [],
        joinedCollections: [],
        totalCollections: 0,
      };
    }

    const myCollections: CollectionData[] = [];
    const joinedCollections: CollectionData[] = [];

    collections.forEach((collection: CollectionWithDetails) => {
      const isOwner = collection.owner_id === user?.id;
      const isMember = true; // TODO: Check if user is a member

      const collectionData: CollectionData = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        members: collection.member_count || 0,
        isPublic: collection.is_public,
        totalValue: parseFloat(collection.total_volume || "0"),
        rank: collection.rank || undefined,
        owner: collection.users?.display_name || collection.users?.username,
        status: collection.status,
        startDate: collection.start_date,
        endDate: collection.end_date,
        avgPnl: parseFloat(collection.avg_pnl || "0"),
        memberCount: collection.member_count || 0,
        isOwner,
        isMember,
      };

      if (isOwner) {
        myCollections.push(collectionData);
      } else {
        joinedCollections.push(collectionData);
      }
    });

    // Sort by rank (if available) or by creation date
    const sortByRank = (a: CollectionData, b: CollectionData) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.rank) return -1;
      if (b.rank) return 1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    };

    myCollections.sort(sortByRank);
    joinedCollections.sort(sortByRank);

    return {
      myCollections,
      joinedCollections,
      totalCollections: collections.length,
    };
  }, [collections, user?.id]);

  const createNewCollection = useCallback(
    async (params: Omit<CreateCollectionParams, "owner_id">) => {
      if (!user?.id) throw new Error("User not authenticated");

      try {
        const collectionParams: CreateCollectionParams = {
          ...params,
          owner_id: user.id,
        };

        const result = await dispatch(
          createCollection(collectionParams)
        ).unwrap();
        return result;
      } catch (error) {
        console.error("Error creating collection:", error);
        throw error;
      }
    },
    [dispatch, user?.id]
  );

  const joinCollection = useCallback(
    async (collectionId: string, inviteCode?: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      try {
        const result = await UserService.joinCollection({
          collection_id: collectionId,
          user_id: user.id,
        });

        // Refresh collections after joining
        await forceRefresh();

        return result;
      } catch (error) {
        console.error("Error joining collection:", error);
        throw error;
      }
    },
    [user?.id, forceRefresh]
  );

  const joinCollectionByInviteCode = useCallback(
    async (inviteCode: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      try {
        const result = await UserService.joinCollectionByInviteCode(
          inviteCode,
          user.id
        );

        // Refresh collections after joining
        await forceRefresh();

        return result;
      } catch (error) {
        console.error("Error joining collection by invite code:", error);
        throw error;
      }
    },
    [user?.id, forceRefresh]
  );

  const getPublicCollections = useCallback(
    async (limit = 20, offset = 0) => {
      if (!user?.id) throw new Error("User not authenticated");

      try {
        const collections = await UserService.getPublicCollections(
          user.id,
          limit,
          offset
        );
        return collections;
      } catch (error) {
        console.error("Error fetching public collections:", error);
        throw error;
      }
    },
    [user?.id]
  );

  const searchCollections = useCallback(
    async (searchTerm: string, limit = 20) => {
      if (!user?.id) throw new Error("User not authenticated");

      try {
        const collections = await UserService.searchCollections(
          searchTerm,
          user.id,
          limit
        );
        return collections;
      } catch (error) {
        console.error("Error searching collections:", error);
        throw error;
      }
    },
    [user?.id]
  );

  const leaveCollection = useCallback(
    async (collectionId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      try {
        await UserService.leaveCollection(collectionId, user.id);
        // Refresh collections after leaving
        await fetchData();
      } catch (error) {
        console.error("Error leaving collection:", error);
        throw error;
      }
    },
    [user?.id, fetchData]
  );

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, fetchData]);

  return {
    ...processedData,
    loading: loading || userLoading,
    refreshing,
    error,
    onRefresh,
    forceRefresh,
    createNewCollection,
    joinCollection,
    joinCollectionByInviteCode,
    getPublicCollections,
    searchCollections,
    leaveCollection,
  };
}
