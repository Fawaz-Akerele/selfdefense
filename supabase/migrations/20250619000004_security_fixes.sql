-- Security hardening: email_logs insert policy + enrolled video access

DROP POLICY IF EXISTS "superadmin_insert_email_logs" ON sydef.email_logs;

CREATE POLICY "service_role_insert_email_logs" ON sydef.email_logs
  FOR INSERT
  WITH CHECK (sydef.is_super_admin());

DROP POLICY IF EXISTS "enrolled_users_read_videos" ON storage.objects;

CREATE POLICY "enrolled_users_read_videos" ON storage.objects FOR SELECT USING (
  bucket_id = 'course-videos'
  AND (
    sydef.is_admin()
    OR EXISTS (
      SELECT 1
      FROM sydef.enrollments e
      JOIN sydef.class_modules m ON m.class_id = e.class_id
      WHERE e.user_id = auth.uid()
        AND m.video_storage_path = storage.objects.name
    )
  )
);
