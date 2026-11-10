-- Hapus semua data demo (absensi & performa ikut terhapus lewat cascade)
delete from attendance_audit where player_id in (select id from players where is_demo) or session_id in (select id from training_sessions where is_demo);
delete from players where is_demo;
delete from training_sessions where is_demo;
