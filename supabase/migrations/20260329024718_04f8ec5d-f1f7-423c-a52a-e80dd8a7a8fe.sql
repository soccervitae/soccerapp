
-- Table for squad membership (linking athletes to teams/schools)
CREATE TABLE public.squad_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_profile_id, athlete_profile_id)
);

-- RLS
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- Everyone can see approved squad members
CREATE POLICY "Approved squad members are viewable by everyone"
  ON public.squad_members FOR SELECT
  USING (status = 'approved');

-- Team owners can see all requests (pending + approved)
CREATE POLICY "Team owners can view all squad requests"
  ON public.squad_members FOR SELECT
  TO authenticated
  USING (team_profile_id = auth.uid());

-- Athletes can see their own requests
CREATE POLICY "Athletes can view own squad requests"
  ON public.squad_members FOR SELECT
  TO authenticated
  USING (athlete_profile_id = auth.uid());

-- Athletes can request to join (insert with pending status)
CREATE POLICY "Athletes can request to join squads"
  ON public.squad_members FOR INSERT
  TO authenticated
  WITH CHECK (athlete_profile_id = auth.uid() AND status = 'pending');

-- Team owners can update status (approve/reject)
CREATE POLICY "Team owners can update squad member status"
  ON public.squad_members FOR UPDATE
  TO authenticated
  USING (team_profile_id = auth.uid());

-- Team owners can remove members
CREATE POLICY "Team owners can remove squad members"
  ON public.squad_members FOR DELETE
  TO authenticated
  USING (team_profile_id = auth.uid());

-- Athletes can cancel their own pending requests
CREATE POLICY "Athletes can cancel own pending requests"
  ON public.squad_members FOR DELETE
  TO authenticated
  USING (athlete_profile_id = auth.uid() AND status = 'pending');
