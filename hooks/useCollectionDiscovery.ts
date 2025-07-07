import { CollectionWithDetails } from "@/types/database";
import { useCallback, useState } from "react";
import { UserService } from "@/services/UserService";
import { useUser } from "@/context/UserContext";

export interface DiscoveredCollection {
  id: string;
  name: string;
  description?: string;
  owner: string;
  memberCount: number;
  maxMembers: number;
  startingBalance: string;
  durationDays: number;
  isPublic: boolean;
  allowInvites: boolean;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate?: string;
  totalVolume: string;
  avgPnl: string;
  inviteCode: string;
}

export function useCollectionDiscovery() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredCollections, setDiscoveredCollections] = useState<
    DiscoveredCollection[]
  >([]);
  const [searchResults, setSearchResults] = useState<DiscoveredCollection[]>(
    []
  );

  const discoverCollections = useCallback(
    async (limit = 20, offset = 0) => {
      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const collections = await UserService.getPublicCollections(
          user.id,
          limit,
          offset
        );

        const processedCollections: DiscoveredCollection[] = collections.map(
          (collection) => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            owner:
              collection.users?.display_name ||
              collection.users?.username ||
              "Unknown",
            memberCount: collection.member_count || 0,
            maxMembers: collection.max_members,
            startingBalance: collection.starting_balance,
            durationDays: collection.duration_days,
            isPublic: collection.is_public,
            allowInvites: collection.allow_invites,
            status: collection.status,
            startDate: collection.start_date,
            endDate: collection.end_date,
            totalVolume: collection.total_volume || "0",
            avgPnl: collection.avg_pnl || "0",
            inviteCode: collection.invite_code,
          })
        );

        setDiscoveredCollections(processedCollections);
      } catch (error) {
        console.error("Error discovering collections:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to discover collections"
        );
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const searchCollections = useCallback(
    async (searchTerm: string, limit = 20) => {
      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      setError(null);

      try {
        const collections = await UserService.searchCollections(
          searchTerm,
          user.id,
          limit
        );

        const processedCollections: DiscoveredCollection[] = collections.map(
          (collection) => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            owner:
              collection.users?.display_name ||
              collection.users?.username ||
              "Unknown",
            memberCount: collection.member_count || 0,
            maxMembers: collection.max_members,
            startingBalance: collection.starting_balance,
            durationDays: collection.duration_days,
            isPublic: collection.is_public,
            allowInvites: collection.allow_invites,
            status: collection.status,
            startDate: collection.start_date,
            endDate: collection.end_date,
            totalVolume: collection.total_volume || "0",
            avgPnl: collection.avg_pnl || "0",
            inviteCode: collection.invite_code,
          })
        );

        setSearchResults(processedCollections);
      } catch (error) {
        console.error("Error searching collections:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to search collections"
        );
      } finally {
        setSearching(false);
      }
    },
    [user?.id]
  );

  const joinCollection = useCallback(
    async (collectionId: string) => {
      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      setJoining(true);
      setError(null);

      try {
        await UserService.joinCollection({
          collection_id: collectionId,
          user_id: user.id,
        });

        // Remove the joined collection from both lists
        setDiscoveredCollections((prev) =>
          prev.filter((c) => c.id !== collectionId)
        );
        setSearchResults((prev) => prev.filter((c) => c.id !== collectionId));

        return true;
      } catch (error) {
        console.error("Error joining collection:", error);
        setError(
          error instanceof Error ? error.message : "Failed to join collection"
        );
        return false;
      } finally {
        setJoining(false);
      }
    },
    [user?.id]
  );

  const joinCollectionByInviteCode = useCallback(
    async (inviteCode: string) => {
      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      setJoining(true);
      setError(null);

      try {
        await UserService.joinCollectionByInviteCode(inviteCode, user.id);
        return true;
      } catch (error) {
        console.error("Error joining collection by invite code:", error);
        setError(
          error instanceof Error ? error.message : "Failed to join collection"
        );
        return false;
      } finally {
        setJoining(false);
      }
    },
    [user?.id]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    // State
    loading,
    searching,
    joining,
    error,
    discoveredCollections,
    searchResults,

    // Actions
    discoverCollections,
    searchCollections,
    joinCollection,
    joinCollectionByInviteCode,
    clearError,
    clearSearch,
  };
}
