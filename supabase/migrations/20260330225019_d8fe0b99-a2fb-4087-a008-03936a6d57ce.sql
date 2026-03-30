-- Allow anonymous (guest) users to read position/function tables
CREATE POLICY "Anyone can read male positions"
ON public.posicao_masculina FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can read female positions"
ON public.posicao_feminina FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can read male functions"
ON public.funcaomas FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can read female functions"
ON public.funcaofem FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated users can read female functions"
ON public.funcaofem FOR SELECT TO authenticated USING (true);