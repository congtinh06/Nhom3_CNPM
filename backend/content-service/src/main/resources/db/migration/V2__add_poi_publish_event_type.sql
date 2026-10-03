ALTER TABLE dbo.poi ADD publish_event_type NVARCHAR(30) NOT NULL 
    CONSTRAINT df_poi_publish_event_type DEFAULT 'POI_CREATED'
    CONSTRAINT ck_poi_publish_event_type CHECK (publish_event_type IN ('POI_CREATED', 'POI_UPDATED'));
GO
