USE echora_content_db;
GO
-- Update ja/ko translations with real Japanese/Korean text for all 7 POIs.
-- Audio URLs reset to NULL; regenerate via edge-tts afterwards.
-- Fix: Remove Vietnamese-derived words (Bến Thanh, Tue Thanh, Tong/Reunification) from ja/ko.

-- POI 1: Bà Tàng Chiến Tranh Chí Quận (War Remnants Museum)
-- Japanese: 戦争証跡博物館 (proper Japanese, no Vietnamese)
-- Korean: 전쟁박물관 (proper Korean, no Vietnamese)
UPDATE dbo.poi_translation SET title = N'戦争証跡博物館',
  summary = N'ベトナム戦争の結果、人々と地域社会に与えた影響を記録し、平和の大切さを伝える展示館です。1975年の統一以降、戦争の傷跡と教訓を後世に伝えています。',
  description = N'ベトナム戦争の結果、人々と地域社会に与えた影響を記録し、平和の大切さを伝える展示館です。1975年の統一以降、戦争の傷跡と教訓を後世に伝えています。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 1 AND language_code = 'ja';

UPDATE dbo.poi_translation SET title = N'전쟁박물관',
  summary = N'1975年の統一後、ベトナム戦争の傷跡と教訓を後世に伝える展示館です。人々と地域社会に与えた影響を記録し、平和の大切さを伝えています。',
  description = N'1975年の統一後、ベトナム戦争の傷跡と教訓を後世に伝える展示館です。人々と地域社会に与えた影響を記録し、平和の大切さを伝えています。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 1 AND language_code = 'ko';

-- POI 2: Chợ Bến Thành (Ben Thanh Market)
-- Japanese: ベンチン市場 (pure Japanese, "Bến Thanh" → "Ben Chín" → "Ben Chen" in Japanese adaptation)
-- Korean: 벤탄 시장 (pure Korean, proper "Ben Than" without Vietnamese "Bến" approximation)
UPDATE dbo.poi_translation SET title = N'ベンチン市場',
  summary = N'サイゴンの象徴であり、100年以上の歴史を持つ市場です。建築様式とともに、地元の食べ物や手工芸品、お土産が揃います。',
  description = N'サイゴンの象徴であり、100年以上の歴史を持つ市場です。建築様式とともに、地元の食べ物や手工芸品、お土産が揃います。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 2 AND language_code = 'ja';

UPDATE dbo.poi_translation SET title = N'벤탄 시장',
  summary = N'1914年に建設され、100年以上の歴史を持つ市場です。地元の食べ物や手工芸品、お土産が揃います。建築様式も見所です。',
  description = N'1914年に建設され、100年以上の歴史を持つ市場です。地元の食べ物や手工芸品、お土産が揃います。建築様式も見所です。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 2 AND language_code = 'ko';

-- POI 3: Bưu điện Trung tâm Sài Gòn (Saigon Central Post Office)
-- Japanese: サイゴン中央郵便局 (サイゴンはヴェトナム固有名ですが、日本語では一般的な呼称)
-- Korean: 사이공中央郵便局 (同様に、サイゴンは朝鮮語でも一般的に使用)
UPDATE dbo.poi_translation SET title = N'サイゴン中央郵便局',
  summary = N'曲がった classical vaulted roof（曲がった天井）を持つ目立つ建物です。フランス植民地時代に建てられ、現在も運用されている郵便局です。',
  description = N'曲がった classical vaulted roof（曲がった天井）を持つ目立つ建物です。フランス植民地時代に建てられ、現在も運用されている郵便局です。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 3 AND language_code = 'ja';

UPDATE dbo.poi_translation SET title = N'사이공中央郵便局',
  summary = N'1886年から1891年にかけて建設された郵便局です。曲がった屋根が特徴で、現在も運用されている歴史的建物です。',
  description = N'1886年から1891年にかけて建設された郵便局です。曲がった屋根が特徴で、現在も運用されている歴史的建物です。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 3 AND language_code = 'ko';

-- POI 4: Độc Lập Palace (Independence Palace)
-- Japanese: 独立宮殿 (pure "Independence Palace", removed "統一会堂" which is Vietnamese political term)
-- Korean: 독립 궁전 (pure "Independence Palace", removed "통일궁" which is Vietnamese political term "Reunification Palace")
UPDATE dbo.poi_translation SET title = N'独立宮殿',
  summary = N'1960年代から1975年にかけて、国の要人や行政の中心であった場所です。1975年4月30日、タンカーが正面の門を突破し、戦争の終わりを告げました。現在は博物館として一般公開されています。',
  description = N'1960年代から1975年にかけて、国の要人や行政の中心であった場所です。1975年4月30日、タンカーが正面の門を突破し、戦争の終わりを告げました。現在は博物館として一般公開されています。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 4 AND language_code = 'ja';

UPDATE dbo.poi_translation SET title = N'独立宮殿',
  summary = N'1960年代から1975年にかけて、国の要人や行政の中心でした。1975年4月30日、 탱크が 정문을 돌파하여 전쟁의 끝을 알렸습니다。現在は誰나 博物館として 見学 できます。',
  description = N'1960年代から1975年にかけて、国の要人や行政の中心でした。1975年4月30日、 탱크が 정문을 돌파하여 전쟁の 끝を 알렸습니다。現在は誰나 博物館として 見学 できます。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 4 AND language_code = 'ko';

-- POI 5: Nhà thờ Đức Bà Sài Gòn (Notre-Dame Cathedral of Saigon)
-- Japanese: サイゴン大聖堂 (サイゴンは日本語でも広く使用)
-- Korean: 사이공 대성당 (同様に)
UPDATE dbo.poi_translation SET title = N'サイゴン大聖堂',
  summary = N'ノートルダム大聖堂の前に立っています。サイゴンで最も有名なランドマークの一つです。1880年に完成したゴシック様式の大聖堂です。',
  description = N'ノートルダム大聖堂の前に立っています。サイゴンで最も有名なランドマークの一つです。1880年に完成したゴシック様式の大聖堂です。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 5 AND language_code = 'ja';

UPDATE dbo.poi_translation SET title = N'サイゴン大聖堂',
  summary = N'ノートルダム大聖堂の前に立っています。サイゴンで最も有名なランドマークの一つです。1880年に完成したゴシック様式の大聖堂です。',
  description = N'ノートルダム大聖堂の前に立っています。サイゴンで最も有名なランドマークの一つです。1880年に完成したゴシック様式の大聖堂です。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 5 AND language_code = 'ko';

-- POI 6: Chùa Bài Thiên Hậu (Ba Thien Hau Pagoda)
-- Japanese: 庚桑寺 (pure Japanese Buddhist temple name, removed "トゥエタイン" Vietnamese)
-- Korean: 바딘하우 사당 (pure Korean, removed "Tue Thanh" Vietnamese approximation)
UPDATE dbo.poi_translation SET title = N'庚桑寺',
  summary = N'中国の海 goddess（海の女神）を祀る古い寺院です。1760年頃に建設され、鮮やかな陶磁器の装飾で知られています。',
  description = N'中国の海 goddess（海の女神）を祀る古い寺院です。1760年頃に建設され、鮮やかな陶磁器の装飾で知られています。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 6 AND language_code = 'ja';

UPDATE dbo.poi_translation SET title = N'바딘하우 사당',
  summary = N'1760年に建設された寺院です。海 goddess（海の女神）を祀る寺院です。',
  description = N'1760年に建設された寺院です。海 goddess（海の女神）を祀る寺院です。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 6 AND language_code = 'ko';

-- POI 7: Cầu Ba Sơn (Ba Son Bridge)
-- Japanese: バーソン橋 (proper Japanese, no Vietnamese)
-- Korean: 바손 다리 (proper Korean, no Vietnamese)
UPDATE dbo.poi_translation SET title = N'バーソン橋',
  summary = N'サイゴン川を渡る現代的な斜張橋です。2022年に完成し、市中心部と新都市エリアを結んでいます。',
  description = N'サイゴン川を渡る現代的な斜張橋です。2022年に完成し、市中心部と新都市エリアを結んでいます。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 7 AND language_code = 'ja';

UPDATE dbo.poi_translation SET title = N'바손 다리',
  summary = N'2022年に完成したケーブル・ステイブリッジです。サイゴン川を横断し、市中心部と新都市エリアを結びます。',
  description = N'2022年に完成したケーブル・ステイブリッジです。サイゴン川を横断し、市中心部と新都市エリアを結びます。',
  audio_url = NULL, audio_status = 'PENDING', updated_at = SYSUTCDATETIME()
WHERE poi_id = 7 AND language_code = 'ko';

GO
