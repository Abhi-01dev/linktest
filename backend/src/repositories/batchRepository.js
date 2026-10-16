import { pool, isPostgresConnected, memoryStore } from '../db/index.js';
import crypto from 'crypto';

export const batchRepository = {
  async getAllBatches(filters = {}) {
    const {
      search,
      status,
      courseId,
      classId,
      limit = 100,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    if (isPostgresConnected && pool) {
      let query = `
        SELECT
          b.*,
          c.title as course_title,
          cls.name as class_name,
          COALESCE(be.student_count, 0)::int as enrolled_count,
          COALESCE(bt.teacher_count, 0)::int as teachers_count,
          (b.capacity - COALESCE(be.student_count, 0))::int as available_capacity
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN classes cls ON b.class_id = cls.id
        LEFT JOIN (
          SELECT batch_id, COUNT(*)::int as student_count
          FROM batch_enrollments
          WHERE status = 'active'
          GROUP BY batch_id
        ) be ON b.id = be.batch_id
        LEFT JOIN (
          SELECT batch_id, COUNT(*)::int as teacher_count
          FROM batch_teachers
          GROUP BY batch_id
        ) bt ON b.id = bt.batch_id
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'ALL') {
        params.push(status);
        query += ` AND b.status = $${params.length}`;
      }

      if (courseId && courseId !== 'ALL') {
        params.push(courseId);
        query += ` AND b.course_id = $${params.length}`;
      }

      if (classId && classId !== 'ALL') {
        params.push(classId);
        query += ` AND b.class_id = $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        query += ` AND (LOWER(b.name) LIKE $${params.length} OR LOWER(COALESCE(b.code, '')) LIKE $${params.length} OR LOWER(COALESCE(b.description, '')) LIKE $${params.length})`;
      }

      const validSorts = ['name', 'code', 'created_at', 'start_date', 'capacity', 'status'];
      const actualSort = validSorts.includes(sortBy) ? `b.${sortBy}` : 'b.created_at';
      const actualOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      query += ` ORDER BY ${actualSort} ${actualOrder}`;

      params.push(limit);
      query += ` LIMIT $${params.length}`;
      params.push(offset);
      query += ` OFFSET $${params.length}`;

      const res = await pool.query(query, params);
      return res.rows;
    }

    // Memory Store fallback
    let list = [...(memoryStore.batches || [])];

    if (status && status !== 'ALL') {
      list = list.filter(b => b.status === status);
    }
    if (courseId && courseId !== 'ALL') {
      list = list.filter(b => b.course_id === courseId);
    }
    if (classId && classId !== 'ALL') {
      list = list.filter(b => b.class_id === classId);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      );
    }

    return list.slice(offset, offset + limit).map(b => {
      const course = memoryStore.courses.find(c => c.id === b.course_id);
      const cls = memoryStore.classes.find(c => c.id === b.class_id);
      const enrolled = (memoryStore.batch_enrollments || []).filter(e => e.batch_id === b.id && e.status === 'active').length;
      const teachers = (memoryStore.batch_teachers || []).filter(t => t.batch_id === b.id).length;
      return {
        ...b,
        course_title: course?.title || null,
        class_name: cls?.name || null,
        enrolled_count: enrolled,
        teachers_count: teachers,
        available_capacity: (b.capacity || 50) - enrolled
      };
    });
  },

  async getBatchesForTeacher(teacherId) {
    if (isPostgresConnected && pool) {
      const query = `
        SELECT DISTINCT
          b.*,
          c.title as course_title,
          cls.name as class_name,
          COALESCE(be.student_count, 0)::int as enrolled_count,
          COALESCE(bt_all.teacher_count, 0)::int as teachers_count,
          (b.capacity - COALESCE(be.student_count, 0))::int as available_capacity
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN classes cls ON b.class_id = cls.id
        LEFT JOIN (
          SELECT batch_id, COUNT(*)::int as student_count
          FROM batch_enrollments
          WHERE status = 'active'
          GROUP BY batch_id
        ) be ON b.id = be.batch_id
        LEFT JOIN (
          SELECT batch_id, COUNT(*)::int as teacher_count
          FROM batch_teachers
          GROUP BY batch_id
        ) bt_all ON b.id = bt_all.batch_id
        WHERE b.id IN (
          SELECT batch_id FROM batch_teachers WHERE teacher_id = $1
          UNION
          SELECT batch_id FROM teacher_assignments WHERE teacher_id = $1 AND batch_id IS NOT NULL
          UNION
          SELECT id FROM batches WHERE class_teacher_id = $1
        )
        ORDER BY b.created_at DESC
      `;
      const res = await pool.query(query, [teacherId]);
      return res.rows;
    }

    const assignedBatchIds = new Set([
      ...(memoryStore.batch_teachers || []).filter(bt => bt.teacher_id === teacherId).map(bt => bt.batch_id),
      ...(memoryStore.teacher_assignments || []).filter(ta => ta.teacher_id === teacherId && ta.batch_id).map(ta => ta.batch_id),
      ...(memoryStore.batches || []).filter(b => b.class_teacher_id === teacherId).map(b => b.id)
    ]);

    return (memoryStore.batches || [])
      .filter(b => assignedBatchIds.has(b.id))
      .map(b => {
        const course = (memoryStore.courses || []).find(c => c.id === b.course_id);
        const cls = (memoryStore.classes || []).find(c => c.id === b.class_id);
        const enrolled = (memoryStore.batch_enrollments || []).filter(e => e.batch_id === b.id && e.status === 'active').length;
        const teachers = (memoryStore.batch_teachers || []).filter(t => t.batch_id === b.id).length;
        return {
          ...b,
          course_title: course?.title || null,
          class_name: cls?.name || null,
          enrolled_count: enrolled,
          teachers_count: teachers,
          available_capacity: (b.capacity || 50) - enrolled
        };
      });
  },

  async getBatchById(id) {
    if (isPostgresConnected && pool) {
      const query = `
        SELECT
          b.*,
          c.title as course_title,
          cls.name as class_name,
          COALESCE(be.student_count, 0)::int as enrolled_count,
          COALESCE(bt.teacher_count, 0)::int as teachers_count,
          (b.capacity - COALESCE(be.student_count, 0))::int as available_capacity
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN classes cls ON b.class_id = cls.id
        LEFT JOIN (
          SELECT batch_id, COUNT(*)::int as student_count
          FROM batch_enrollments
          WHERE status = 'active'
          GROUP BY batch_id
        ) be ON b.id = be.batch_id
        LEFT JOIN (
          SELECT batch_id, COUNT(*)::int as teacher_count
          FROM batch_teachers
          GROUP BY batch_id
        ) bt ON b.id = bt.batch_id
        WHERE b.id = $1
      `;
      const res = await pool.query(query, [id]);
      return res.rows[0] || null;
    }

    const b = (memoryStore.batches || []).find(batch => batch.id === id);
    if (!b) return null;
    const course = memoryStore.courses.find(c => c.id === b.course_id);
    const cls = memoryStore.classes.find(c => c.id === b.class_id);
    const enrolled = (memoryStore.batch_enrollments || []).filter(e => e.batch_id === b.id && e.status === 'active').length;
    const teachers = (memoryStore.batch_teachers || []).filter(t => t.batch_id === b.id).length;
    return {
      ...b,
      course_title: course?.title || null,
      class_name: cls?.name || null,
      enrolled_count: enrolled,
      teachers_count: teachers,
      available_capacity: (b.capacity || 50) - enrolled
    };
  },

  async findByCode(code) {
    if (!code) return null;
    const normalized = code.trim().toUpperCase();
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM batches WHERE UPPER(code) = $1', [normalized]);
      return res.rows[0] || null;
    }
    return (memoryStore.batches || []).find(b => b.code?.toUpperCase() === normalized) || null;
  },

  async createBatch(data) {
    const id = data.id || `batch-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const {
      name,
      code,
      course_id = null,
      class_id = null,
      description = '',
      start_date = null,
      end_date = null,
      capacity = 40,
      status = 'Active',
      class_teacher_id = null
    } = data;

    const normalizedCode = (code || `BATCH-${id.toUpperCase()}`).trim().toUpperCase();
    const normalizedCourseId = (course_id && String(course_id).trim() !== '') ? String(course_id).trim() : null;
    const normalizedClassId = (class_id && String(class_id).trim() !== '') ? String(class_id).trim() : null;
    const normalizedTeacherId = (class_teacher_id && String(class_teacher_id).trim() !== '') ? String(class_teacher_id).trim() : null;
    const normalizedStartDate = (start_date && String(start_date).trim() !== '') ? String(start_date).trim() : null;
    const normalizedEndDate = (end_date && String(end_date).trim() !== '') ? String(end_date).trim() : null;

    if (isPostgresConnected && pool) {
      const query = `
        INSERT INTO batches (id, name, code, course_id, class_id, description, start_date, end_date, capacity, status, class_teacher_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
        RETURNING *
      `;
      const res = await pool.query(query, [
        id,
        name.trim(),
        normalizedCode,
        normalizedCourseId,
        normalizedClassId,
        description,
        normalizedStartDate,
        normalizedEndDate,
        capacity,
        status,
        normalizedTeacherId,
        now
      ]);
      return res.rows[0];
    }

    const newBatch = {
      id,
      name: name.trim(),
      code: normalizedCode,
      course_id: normalizedCourseId,
      class_id: normalizedClassId,
      description,
      start_date: normalizedStartDate,
      end_date: normalizedEndDate,
      capacity,
      status,
      class_teacher_id: normalizedTeacherId,
      created_at: now,
      updated_at: now
    };
    if (!memoryStore.batches) memoryStore.batches = [];
    memoryStore.batches.push(newBatch);
    return newBatch;
  },

  async updateBatch(id, updates) {
    const existing = await this.getBatchById(id);
    if (!existing) return null;

    const now = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const fields = [];
      const values = [];

      const allowed = ['name', 'code', 'course_id', 'class_id', 'description', 'start_date', 'end_date', 'capacity', 'status', 'class_teacher_id'];
      allowed.forEach(key => {
        if (updates[key] !== undefined) {
          let val = updates[key];
          if (key === 'code' && val) val = val.trim().toUpperCase();
          if (['course_id', 'class_id', 'class_teacher_id', 'start_date', 'end_date'].includes(key)) {
            val = (val && String(val).trim() !== '') ? String(val).trim() : null;
          }
          values.push(val);
          fields.push(`${key} = $${values.length}`);
        }
      });

      if (fields.length === 0) return existing;

      values.push(now);
      fields.push(`updated_at = $${values.length}`);

      values.push(id);
      const query = `UPDATE batches SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    }

    const b = (memoryStore.batches || []).find(batch => batch.id === id);
    if (!b) return null;
    Object.assign(b, updates, { updated_at: now });
    if (b.code) b.code = b.code.trim().toUpperCase();
    return b;
  },

  async archiveBatch(id) {
    return this.updateBatch(id, { status: 'Archived' });
  },

  async deleteBatch(id) {
    const batch = await this.getBatchById(id);
    if (!batch) return { success: false, code: 'NOT_FOUND', message: 'Batch not found.' };

    if (isPostgresConnected && pool) {
      await pool.query('DELETE FROM batch_enrollments WHERE batch_id = $1', [id]);
      await pool.query('DELETE FROM batch_teachers WHERE batch_id = $1', [id]);
      await pool.query('DELETE FROM student_class_enrollments WHERE batch_id = $1', [id]);
      await pool.query('DELETE FROM batches WHERE id = $1', [id]);
      return { success: true };
    }

    if (memoryStore.batch_enrollments) {
      memoryStore.batch_enrollments = memoryStore.batch_enrollments.filter(e => e.batch_id !== id);
    }
    if (memoryStore.batch_teachers) {
      memoryStore.batch_teachers = memoryStore.batch_teachers.filter(t => t.batch_id !== id);
    }
    const idx = (memoryStore.batches || []).findIndex(b => b.id === id);
    if (idx !== -1) memoryStore.batches.splice(idx, 1);
    return { success: true };
  },

  // ── Teacher Allocations ──────────────────────────────────────────────────
  async getBatchTeachers(batchId) {
    if (isPostgresConnected && pool) {
      const query = `
        SELECT
          bt.id as allocation_id,
          bt.batch_id,
          bt.teacher_id,
          bt.assigned_at,
          u.full_name,
          u.email,
          u.avatar_url,
          u.status,
          assigner.full_name as assigned_by_name
        FROM batch_teachers bt
        JOIN users u ON bt.teacher_id = u.id
        LEFT JOIN users assigner ON bt.assigned_by = assigner.id
        WHERE bt.batch_id = $1
        ORDER BY bt.assigned_at DESC
      `;
      const res = await pool.query(query, [batchId]);
      return res.rows;
    }

    const allocs = (memoryStore.batch_teachers || []).filter(bt => bt.batch_id === batchId);
    return allocs.map(bt => {
      const u = memoryStore.users.find(user => user.id === bt.teacher_id);
      const assigner = memoryStore.users.find(user => user.id === bt.assigned_by);
      return {
        allocation_id: bt.id,
        batch_id: bt.batch_id,
        teacher_id: bt.teacher_id,
        assigned_at: bt.assigned_at,
        full_name: u?.full_name || 'Teacher',
        email: u?.email || '',
        avatar_url: u?.avatar_url || null,
        status: u?.status || 'active',
        assigned_by_name: assigner?.full_name || 'Administrator'
      };
    });
  },

  async assignTeacherToBatch({ batchId, teacherId, assignedBy }) {
    const id = `bt-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    if (isPostgresConnected && pool) {
      const query = `
        INSERT INTO batch_teachers (id, batch_id, teacher_id, assigned_by, assigned_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (batch_id, teacher_id) DO NOTHING
        RETURNING *
      `;
      const res = await pool.query(query, [id, batchId, teacherId, assignedBy, now]);
      if (res.rows.length === 0) {
        const err = new Error('Teacher is already assigned to this batch.');
        err.statusCode = 409;
        err.code = 'ALREADY_ASSIGNED';
        throw err;
      }
      return res.rows[0];
    }

    if (!memoryStore.batch_teachers) memoryStore.batch_teachers = [];
    const exists = memoryStore.batch_teachers.some(bt => bt.batch_id === batchId && bt.teacher_id === teacherId);
    if (exists) {
      const err = new Error('Teacher is already assigned to this batch.');
      err.statusCode = 409;
      err.code = 'ALREADY_ASSIGNED';
      throw err;
    }

    const record = { id, batch_id: batchId, teacher_id: teacherId, assigned_by: assignedBy, assigned_at: now };
    memoryStore.batch_teachers.push(record);
    return record;
  },

  async removeTeacherFromBatch(batchId, teacherId) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('DELETE FROM batch_teachers WHERE batch_id = $1 AND teacher_id = $2 RETURNING *', [batchId, teacherId]);
      return res.rowCount > 0;
    }

    const idx = (memoryStore.batch_teachers || []).findIndex(bt => bt.batch_id === batchId && bt.teacher_id === teacherId);
    if (idx !== -1) {
      memoryStore.batch_teachers.splice(idx, 1);
      return true;
    }
    return false;
  },

  async isTeacherAssignedToBatch(batchId, teacherId) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        `SELECT 1 FROM batch_teachers WHERE batch_id = $1 AND teacher_id = $2
         UNION
         SELECT 1 FROM teacher_assignments WHERE batch_id = $1 AND teacher_id = $2
         LIMIT 1`,
        [batchId, teacherId]
      );
      return res.rows.length > 0;
    }

    const inBt = (memoryStore.batch_teachers || []).some(bt => bt.batch_id === batchId && bt.teacher_id === teacherId);
    if (inBt) return true;
    return (memoryStore.teacher_assignments || []).some(ta => ta.batch_id === batchId && ta.teacher_id === teacherId);
  },


  // ── Student Enrollments ──────────────────────────────────────────────────
  async getBatchStudents(batchId) {
    if (isPostgresConnected && pool) {
      const query = `
        SELECT
          be.id as enrollment_id,
          be.batch_id,
          be.student_id,
          be.status,
          be.enrolled_at,
          u.full_name,
          u.email,
          u.avatar_url,
          u.phone,
          sp.enrollment_number,
          enroll_user.full_name as enrolled_by_name
        FROM batch_enrollments be
        JOIN users u ON be.student_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN users enroll_user ON be.enrolled_by = enroll_user.id
        WHERE be.batch_id = $1 AND be.status = 'active'
        ORDER BY be.enrolled_at DESC
      `;
      const res = await pool.query(query, [batchId]);
      return res.rows;
    }

    const enrolls = (memoryStore.batch_enrollments || []).filter(be => be.batch_id === batchId && be.status === 'active');
    return enrolls.map(be => {
      const u = memoryStore.users.find(user => user.id === be.student_id);
      const sp = (memoryStore.student_profiles || []).find(p => p.user_id === be.student_id);
      const enroller = memoryStore.users.find(user => user.id === be.enrolled_by);
      return {
        enrollment_id: be.id,
        batch_id: be.batch_id,
        student_id: be.student_id,
        status: be.status,
        enrolled_at: be.enrolled_at,
        full_name: u?.full_name || 'Student',
        email: u?.email || '',
        avatar_url: u?.avatar_url || null,
        phone: u?.phone || null,
        enrollment_number: sp?.enrollment_number || null,
        roll_number: sp?.roll_number || null,
        enrolled_by_name: enroller?.full_name || 'Staff'
      };
    });
  },

  async enrollStudentsBulkInBatch({ batchId, studentIds, enrolledBy }) {
    const batch = await this.getBatchById(batchId);
    if (!batch) {
      const err = new Error('Batch not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (batch.status === 'Archived' || batch.status === 'Completed') {
      const err = new Error(`Cannot enroll students into ${batch.status.toLowerCase()} batch.`);
      err.statusCode = 400;
      err.code = 'BATCH_NOT_OPEN';
      throw err;
    }

    const currentEnrolledCount = batch.enrolled_count || 0;
    const capacity = batch.capacity || 50;

    const enrolled = [];
    const failed = [];

    for (const studentId of studentIds) {
      // Check remaining capacity
      if (currentEnrolledCount + enrolled.length >= capacity) {
        failed.push({ student_id: studentId, reason: `Batch capacity (${capacity}) reached.` });
        continue;
      }

      try {
        const id = `be-${crypto.randomUUID().slice(0, 8)}`;
        const now = new Date().toISOString();

        if (isPostgresConnected && pool) {
          // Check student validity
          const studentRes = await pool.query('SELECT id, full_name, role FROM users WHERE id = $1', [studentId]);
          const student = studentRes.rows[0];
          if (!student || student.role !== 'STUDENT') {
            failed.push({ student_id: studentId, reason: 'Eligible student account not found.' });
            continue;
          }

          // Check if already actively enrolled in this batch
          const existingRes = await pool.query(
            "SELECT id FROM batch_enrollments WHERE batch_id = $1 AND student_id = $2 AND status = 'active'",
            [batchId, studentId]
          );
          if (existingRes.rows.length > 0) {
            failed.push({ student_id: studentId, reason: 'Student is already enrolled in this batch.' });
            continue;
          }

          const insertRes = await pool.query(
            `INSERT INTO batch_enrollments (id, batch_id, student_id, enrolled_by, status, enrolled_at)
             VALUES ($1, $2, $3, $4, 'active', $5)
             ON CONFLICT (batch_id, student_id) DO UPDATE SET status = 'active'
             RETURNING *`,
            [id, batchId, studentId, enrolledBy, now]
          );

          enrolled.push({
            enrollment: insertRes.rows[0],
            student_id: studentId,
            full_name: student.full_name
          });
        } else {
          const student = memoryStore.users.find(u => u.id === studentId && u.role === 'STUDENT');
          if (!student) {
            failed.push({ student_id: studentId, reason: 'Eligible student account not found.' });
            continue;
          }

          if (!memoryStore.batch_enrollments) memoryStore.batch_enrollments = [];
          const existingIdx = memoryStore.batch_enrollments.findIndex(be => be.batch_id === batchId && be.student_id === studentId);
          if (existingIdx !== -1) {
            memoryStore.batch_enrollments[existingIdx].status = 'active';
            enrolled.push({ enrollment: memoryStore.batch_enrollments[existingIdx], student_id: studentId, full_name: student.full_name });
          } else {
            const rec = { id, batch_id: batchId, student_id: studentId, enrolled_by: enrolledBy, status: 'active', enrolled_at: now };
            memoryStore.batch_enrollments.push(rec);
            enrolled.push({ enrollment: rec, student_id: studentId, full_name: student.full_name });
          }
        }
      } catch (err) {
        failed.push({ student_id: studentId, reason: err.message });
      }
    }

    return {
      enrolled,
      failed,
      total_requested: studentIds.length,
      total_enrolled: enrolled.length,
      enrolled_count: enrolled.length
    };
  },

  async removeStudentFromBatch(batchId, studentId) {
    if (isPostgresConnected && pool) {
      const res = await pool.query(
        'DELETE FROM batch_enrollments WHERE batch_id = $1 AND student_id = $2 RETURNING *',
        [batchId, studentId]
      );
      return res.rowCount > 0;
    }

    const idx = (memoryStore.batch_enrollments || []).findIndex(be => be.batch_id === batchId && be.student_id === studentId);
    if (idx !== -1) {
      memoryStore.batch_enrollments.splice(idx, 1);
      return true;
    }
    return false;
  }
};
