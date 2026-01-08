import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminStats() {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [
        usersResult,
        postsResult,
        reportsResult,
        profileReportsResult,
        storiesResult,
        messagesResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profile_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("stories").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
      ]);

      // Get new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: newUsersThisWeek } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo.toISOString());

      // Get new posts this week
      const { count: newPostsThisWeek } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo.toISOString());

      return {
        totalUsers: usersResult.count ?? 0,
        totalPosts: postsResult.count ?? 0,
        pendingReports: (reportsResult.count ?? 0) + (profileReportsResult.count ?? 0),
        totalStories: storiesResult.count ?? 0,
        totalMessages: messagesResult.count ?? 0,
        newUsersThisWeek: newUsersThisWeek ?? 0,
        newPostsThisWeek: newPostsThisWeek ?? 0,
      };
    },
    staleTime: 30 * 1000, // Refresh every 30 seconds
  });
}
