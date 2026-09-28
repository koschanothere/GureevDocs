const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const AdmZip = require("adm-zip");
const Database = require("better-sqlite3");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const APPROVAL_STATUSES = ["na", "approved", "pending", "not_sent"];
const PAYMENT_STATUSES = ["paid", "partial", "unpaid"];
const COMMENT_COLORS = ["pink", "violet"];
const BUSINESS_TYPES = ["ooo", "ip"];
const DOC_TYPES = ["commercial_proposal", "act", "invoice", "invoice_facture", "report", "outgoing_letter", "order", "waybill"];
const TABLE_COLUMNS = {
  objects: ["id", "name", "customer", "address", "comment", "folder_created_date", "is_ooo", "is_ip", "created_at"],
  commercial_proposals: ["id", "object_id", "number", "date", "amount", "status", "business_type", "advance_percent", "comment", "file_path", "original_filename", "created_at"],
  contracts: ["id", "object_id", "number", "date", "amount", "status", "payment_status", "partial_payment_amount", "business_type", "advance_percent", "comment", "comment_color", "file_path", "original_filename", "created_at"],
  annexes: ["id", "contract_id", "number", "date", "amount", "status", "payment_status", "partial_payment_amount", "advance_percent", "file_path", "original_filename", "created_at"],
  secondary_documents: ["id", "parent_type", "parent_id", "doc_type", "number", "date", "amount", "status", "payment_status", "partial_payment_amount", "file_path", "original_filename", "created_at"],
};
const FILE_TABLES = ["commercial_proposals", "contracts", "annexes", "secondary_documents"];

function createStore(userDataPath) {
  const dataDir = path.join(userDataPath, "data");
  const filesDir = path.join(userDataPath, "files");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(filesDir, { recursive: true });

  const db = new Database(path.join(dataDir, "gureevdoc.sqlite"));
  db.pragma("foreign_keys = ON");
  migrate(db);

  const now = () => new Date().toISOString();

  function tableRows(table) {
    return db.prepare(`SELECT ${TABLE_COLUMNS[table].join(", ")} FROM ${table} ORDER BY id`).all();
  }

  function csvFor(table, rows) {
    const columns = FILE_TABLES.includes(table)
      ? [...TABLE_COLUMNS[table], "archive_file_path"]
      : TABLE_COLUMNS[table];
    return stringify(rows, { header: true, columns, bom: true });
  }

  function parseCsvEntry(zip, entryName) {
    const entry = zip.getEntry(entryName);
    if (!entry) return [];
    const content = entry.getData().toString("utf8");
    if (!content.trim()) return [];
    return parse(content, {
      columns: true,
      bom: true,
      skip_empty_lines: true,
    });
  }

  function sanitizeArchiveName(value) {
    return String(value || "file")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140) || "file";
  }

  function makeArchiveFilePath(table, row) {
    const baseName = sanitizeArchiveName(row.original_filename || path.basename(row.file_path || ""));
    return `files/${table}/${row.id}-${baseName}`;
  }

  function copyImportedFile(zip, archiveFilePath, originalFilename) {
    if (!archiveFilePath) return null;
    const normalized = String(archiveFilePath).replace(/\\/g, "/");
    const entry = zip.getEntry(normalized);
    if (!entry || entry.isDirectory) return null;

    const extension = path.extname(originalFilename || normalized);
    const targetPath = path.join(filesDir, `${crypto.randomUUID()}${extension}`);
    fs.writeFileSync(targetPath, entry.getData());
    return targetPath;
  }

  function clearFilesDir() {
    fs.mkdirSync(filesDir, { recursive: true });
    for (const entry of fs.readdirSync(filesDir)) {
      fs.rmSync(path.join(filesDir, entry), { recursive: true, force: true });
    }
  }

  function normalizeImportedRow(row, table, zip) {
    const result = {};
    for (const column of TABLE_COLUMNS[table]) {
      if (column === "amount" || column === "partial_payment_amount" || column === "advance_percent") {
        result[column] = normalizeMoney(row[column]);
      } else if (column.endsWith("_id") || column === "id" || column === "parent_id") {
        result[column] = Number(row[column]);
      } else if (column === "is_ooo" || column === "is_ip") {
        result[column] = Number(row[column]) ? 1 : 0;
      } else {
        result[column] = row[column] === "" || row[column] === undefined ? null : row[column];
      }
    }

    if (FILE_TABLES.includes(table)) {
      result.file_path = copyImportedFile(zip, row.archive_file_path, row.original_filename) || null;
    }

    if (table === "objects") {
      result.name = result.name || "";
      result.customer = result.customer || "";
      result.address = result.address || "";
      result.comment = result.comment || "";
    }

    if (table === "contracts" || table === "commercial_proposals" || table === "annexes" || table === "secondary_documents") {
      result.number = result.number || "";
    }

    if (table === "contracts" || table === "commercial_proposals") {
      result.comment = result.comment || "";
    }

    if (table === "contracts" || table === "annexes" || table === "secondary_documents") {
      result.partial_payment_amount = paymentPartialAmount(result);
    }

    if (table === "contracts") {
      result.comment_color = result.comment_color || "pink";
    }

    return result;
  }

  function insertRows(table, rows) {
    if (rows.length === 0) return;
    const columns = TABLE_COLUMNS[table];
    const placeholders = columns.map((column) => `@${column}`).join(", ");
    const statement = db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`);
    for (const row of rows) {
      statement.run(row);
    }
  }

  function assertEnum(value, allowed, field) {
    if (!allowed.includes(value)) {
      throw new Error(`Некорректное значение ${field}: ${value}`);
    }
  }

  function normalizeBusinessType(value) {
    if (value === undefined || value === null || value === "") return null;
    assertEnum(value, BUSINESS_TYPES, "business_type");
    return value;
  }

  function cascadeObjectBusinessType(objectId, businessType) {
    if (businessType === "ooo") {
      db.prepare("UPDATE objects SET is_ooo = 1 WHERE id = ? AND is_ooo = 0").run(objectId);
    } else if (businessType === "ip") {
      db.prepare("UPDATE objects SET is_ip = 1 WHERE id = ? AND is_ip = 0").run(objectId);
    }
  }

  function normalizeMoney(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    if (Number.isNaN(number)) throw new Error("Сумма должна быть числом");
    return number;
  }

  function normalizePercent(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    if (Number.isNaN(number)) throw new Error("Аванс должен быть числом");
    if (number < 0 || number > 100) throw new Error("Аванс должен быть от 0 до 100");
    return number;
  }

  function paymentPartialAmount(payload) {
    if (payload.payment_status === "partial") return normalizeMoney(payload.partial_payment_amount);
    if (payload.payment_status === "paid") return normalizeMoney(payload.amount);
    return null;
  }

  const sumPaidInvoicesStmt = db.prepare(`
    SELECT amount, payment_status, partial_payment_amount
    FROM secondary_documents
    WHERE parent_type = ? AND parent_id = ? AND doc_type = 'invoice'
  `);

  function invoicePaidAmount(invoice) {
    if (invoice.payment_status === "paid") return invoice.amount || 0;
    if (invoice.payment_status === "partial") return invoice.partial_payment_amount || 0;
    return 0;
  }

  function sumPaidInvoices(parentType, parentId) {
    return sumPaidInvoicesStmt.all(parentType, parentId).reduce((sum, invoice) => sum + invoicePaidAmount(invoice), 0);
  }

  function deriveDocumentPayment(amount, paidSum) {
    if (paidSum <= 0) return { payment_status: "unpaid", partial_payment_amount: null };
    if (amount && paidSum >= amount) return { payment_status: "paid", partial_payment_amount: null };
    return { payment_status: "partial", partial_payment_amount: paidSum };
  }

  function withComputedPayment(row, parentType) {
    if (!row) return row;
    const paidSum = sumPaidInvoices(parentType, row.id);
    return { ...row, ...deriveDocumentPayment(row.amount, paidSum) };
  }

  function storeFile(sourceFilePath, originalFilename) {
    if (!sourceFilePath) {
      return { file_path: null, original_filename: originalFilename || null };
    }

    const extension = path.extname(originalFilename || sourceFilePath);
    const targetName = `${crypto.randomUUID()}${extension}`;
    const targetPath = path.join(filesDir, targetName);
    fs.copyFileSync(sourceFilePath, targetPath);
    return {
      file_path: targetPath,
      original_filename: originalFilename || path.basename(sourceFilePath),
    };
  }

  function replaceStoredFile(current, payload) {
    if (!payload.sourceFilePath) {
      return {
        file_path: current?.file_path || null,
        original_filename: current?.original_filename || null,
      };
    }

    const replacement = storeFile(payload.sourceFilePath, payload.original_filename);
    removeStoredFile(current?.file_path);
    return replacement;
  }

  function removeStoredFile(filePath) {
    if (!filePath) return;
    const relative = path.relative(filesDir, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) return;
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }

  function listObjects() {
    return db.prepare(`
      SELECT
        o.*,
        COUNT(DISTINCT cp.id) AS proposals_count,
        COUNT(DISTINCT c.id) AS contracts_count,
        COUNT(DISTINCT a.id) AS annexes_count,
        COUNT(DISTINCT sd.id) AS secondary_count
      FROM objects o
      LEFT JOIN commercial_proposals cp ON cp.object_id = o.id
      LEFT JOIN contracts c ON c.object_id = o.id
      LEFT JOIN annexes a ON a.contract_id = c.id
      LEFT JOIN secondary_documents sd ON
        (sd.parent_type = 'contract' AND sd.parent_id = c.id)
        OR (sd.parent_type = 'annex' AND sd.parent_id = a.id)
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();
  }

  function seedDevelopmentData({ reset = false } = {}) {
    if (reset) {
      const resetData = db.transaction(() => {
        db.prepare("DELETE FROM secondary_documents").run();
        db.prepare("DELETE FROM annexes").run();
        db.prepare("DELETE FROM contracts").run();
        db.prepare("DELETE FROM commercial_proposals").run();
        db.prepare("DELETE FROM objects").run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('objects', 'commercial_proposals', 'contracts', 'annexes', 'secondary_documents')").run();
        clearFilesDir();
      });
      resetData();
    }

    const existingObjects = db.prepare("SELECT COUNT(*) AS count FROM objects").get().count;
    if (existingObjects > 0) {
      return { ok: true, seeded: false };
    }

    const seed = db.transaction(() => {
      const createdAt = (date) => `${date}T09:00:00.000Z`;

      db.prepare(`
        INSERT INTO objects (id, name, customer, address, comment, folder_created_date, is_ooo, is_ip, created_at)
        VALUES
          (1, 'ЖК Северный квартал', 'ООО Северстрой', 'Москва, Северный проспект, 14', 'Монолит, 2 очередь. Проверить закрывающие за июль.', '2026-07-18', 1, 0, @created_1),
          (2, 'Складской комплекс Восток', 'АО Восток Девелопмент', 'Московская область, промзона Восточная', 'Генподряд, инженерные сети.', '2026-06-02', 0, 1, @created_2),
          (3, 'БЦ Гурьев Плаза', 'ООО Гурьев Плаза', 'Москва, ул. Правды, 22', 'Отделка общественных зон, высокий приоритет.', '2026-08-19', 1, 1, @created_3),
          (4, 'Школа на Лесной', 'ГБУ Дирекция строительства', 'Химки, ул. Лесная, 7', 'Тендерная стадия, ждём обратную связь по КП.', '2026-09-03', 0, 0, @created_4)
      `).run({
        created_1: createdAt("2026-07-18"),
        created_2: createdAt("2026-06-02"),
        created_3: createdAt("2026-08-19"),
        created_4: createdAt("2026-09-03"),
      });

      db.prepare(`
        INSERT INTO commercial_proposals
          (id, object_id, number, date, amount, status, business_type, comment, file_path, original_filename, created_at)
        VALUES
          (1, 1, 'КП-21', '2026-08-28', 3400000, 'pending', 'ooo', 'кровля', NULL, 'kp-21.pdf', @created_1),
          (2, 4, 'КП-44/26', '2026-09-08', 5750000, 'not_sent', NULL, 'тендер', NULL, 'kp-school-draft.pdf', @created_2),
          (3, 3, 'КП-39/26', '2026-08-24', 2100000, 'approved', 'ip', 'витражи', NULL, 'kp-vitraji.pdf', @created_3)
      `).run({
        created_1: createdAt("2026-08-28"),
        created_2: createdAt("2026-09-08"),
        created_3: createdAt("2026-08-24"),
      });

      db.prepare(`
        INSERT INTO contracts
          (id, object_id, number, date, amount, status, payment_status, partial_payment_amount, business_type, comment, comment_color, file_path, original_filename, created_at)
        VALUES
          (1, 1, '14-К/26', '2026-07-21', 18400000, 'approved', 'partial', 7000000, 'ooo', 'фасад', 'pink', NULL, 'contract-14-k-26.pdf', @created_1),
          (2, 2, '08-В/26', '2026-06-07', 9200000, 'pending', 'unpaid', NULL, 'ip', 'сети', 'violet', NULL, NULL, @created_2),
          (3, 3, '31-ОЗ/26', '2026-08-30', 12600000, 'approved', 'paid', NULL, 'ooo', 'отделка', 'violet', NULL, 'contract-31-oz-26.pdf', @created_3),
          (4, 4, 'без номера', '2026-09-12', 5750000, 'pending', 'partial', 1500000, NULL, 'срочно', 'pink', NULL, 'contract-school-scan.pdf', @created_4)
      `).run({
        created_1: createdAt("2026-07-21"),
        created_2: createdAt("2026-06-07"),
        created_3: createdAt("2026-08-30"),
        created_4: createdAt("2026-09-12"),
      });

      db.prepare(`
        INSERT INTO annexes
          (id, contract_id, number, date, amount, status, payment_status, partial_payment_amount, file_path, original_filename, created_at)
        VALUES
          (1, 1, '1', '2026-08-02', 1260000, 'approved', 'paid', NULL, NULL, NULL, @created_1),
          (2, 3, '1', '2026-09-05', 850000, 'pending', 'partial', 300000, NULL, 'ds-materialy.pdf', @created_2),
          (3, 4, '1', '2026-09-14', 420000, 'not_sent', 'unpaid', NULL, NULL, 'ds-avans.pdf', @created_3)
      `).run({
        created_1: createdAt("2026-08-02"),
        created_2: createdAt("2026-09-05"),
        created_3: createdAt("2026-09-14"),
      });

      db.prepare(`
        INSERT INTO secondary_documents
          (id, parent_type, parent_id, doc_type, number, date, amount, status, payment_status, partial_payment_amount, file_path, original_filename, created_at)
        VALUES
          (1, 'contract', 1, 'invoice', 'С-42', '2026-08-10', 4600000, 'na', 'partial', 1200000, NULL, 'schet-14k-avgust.pdf', @created_1),
          (2, 'annex', 1, 'act', 'А-17', '2026-08-22', 1260000, 'not_sent', 'unpaid', NULL, NULL, 'akt-ds-1.pdf', @created_2),
          (3, 'contract', 1, 'commercial_proposal', 'КП-18/26', '2026-07-12', 18400000, 'approved', 'unpaid', NULL, NULL, 'kp-pereneseno-pod-dogovor.pdf', @created_3),
          (4, 'contract', 3, 'invoice_facture', 'СФ-118', '2026-09-02', 12600000, 'na', 'paid', NULL, NULL, 'schet-faktura-118.pdf', @created_4),
          (5, 'contract', 3, 'outgoing_letter', 'ИСХ-77', '2026-09-07', NULL, 'pending', 'unpaid', NULL, NULL, 'letter-change-deadline.pdf', @created_5),
          (6, 'annex', 2, 'invoice', 'СЧ-204', '2026-09-06', 850000, 'na', 'partial', 300000, NULL, 'invoice-ds-materialy.pdf', @created_6),
          (7, 'annex', 2, 'act', 'АКТ-56', '2026-09-11', 850000, 'approved', 'unpaid', NULL, NULL, 'akt-56.pdf', @created_7),
          (8, 'contract', 4, 'waybill', 'ТН-009', '2026-09-13', 240000, 'not_sent', 'unpaid', NULL, NULL, 'nakladnaya-009.pdf', @created_8),
          (9, 'annex', 3, 'order', 'ПР-12', '2026-09-15', NULL, 'approved', 'unpaid', NULL, NULL, 'prikaz-12.pdf', @created_9),
          (10, 'contract', 2, 'report', 'ОТЧ-03', '2026-08-31', NULL, 'pending', 'unpaid', NULL, NULL, 'weekly-report-03.pdf', @created_10)
      `).run({
        created_1: createdAt("2026-08-10"),
        created_2: createdAt("2026-08-22"),
        created_3: createdAt("2026-07-12"),
        created_4: createdAt("2026-09-02"),
        created_5: createdAt("2026-09-07"),
        created_6: createdAt("2026-09-06"),
        created_7: createdAt("2026-09-11"),
        created_8: createdAt("2026-09-13"),
        created_9: createdAt("2026-09-15"),
        created_10: createdAt("2026-08-31"),
      });

      for (const table of ["objects", "commercial_proposals", "contracts", "annexes", "secondary_documents"]) {
        db.prepare(`UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM ${table}) WHERE name = ?`).run(table);
      }
    });

    seed();
    return { ok: true, seeded: true };
  }

  function createObject(payload) {
    const stmt = db.prepare(`
      INSERT INTO objects (name, customer, address, comment, folder_created_date, is_ooo, is_ip, created_at)
      VALUES (@name, @customer, @address, @comment, @folder_created_date, @is_ooo, @is_ip, @created_at)
    `);
    const info = stmt.run({
      name: String(payload.name || "").trim(),
      customer: payload.customer || "",
      address: payload.address || "",
      comment: payload.comment || "",
      folder_created_date: payload.folder_created_date || null,
      is_ooo: payload.is_ooo ? 1 : 0,
      is_ip: payload.is_ip ? 1 : 0,
      created_at: now(),
    });
    return getObjectDetails(info.lastInsertRowid);
  }

  function updateObject(payload) {
    db.prepare(`
      UPDATE objects
      SET name = @name,
          customer = @customer,
          address = @address,
          comment = @comment,
          folder_created_date = @folder_created_date,
          is_ooo = @is_ooo,
          is_ip = @is_ip
      WHERE id = @id
    `).run({
      id: payload.id,
      name: String(payload.name || "").trim(),
      customer: payload.customer || "",
      address: payload.address || "",
      comment: payload.comment || "",
      folder_created_date: payload.folder_created_date || null,
      is_ooo: payload.is_ooo ? 1 : 0,
      is_ip: payload.is_ip ? 1 : 0,
    });
    return getObjectDetails(payload.id);
  }

  function deleteObject(id) {
    db.prepare("DELETE FROM objects WHERE id = ?").run(id);
    return { ok: true };
  }

  function createCommercialProposal(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    const businessType = normalizeBusinessType(payload.business_type);
    const file = storeFile(payload.sourceFilePath, payload.original_filename);
    const info = db.prepare(`
      INSERT INTO commercial_proposals
        (object_id, number, date, amount, status, business_type, advance_percent, comment, file_path, original_filename, created_at)
      VALUES
        (@object_id, @number, @date, @amount, @status, @business_type, @advance_percent, @comment, @file_path, @original_filename, @created_at)
    `).run({
      object_id: payload.object_id,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      business_type: businessType,
      advance_percent: normalizePercent(payload.advance_percent),
      comment: payload.comment || "",
      file_path: file.file_path,
      original_filename: file.original_filename,
      created_at: now(),
    });
    cascadeObjectBusinessType(payload.object_id, businessType);
    return getCommercialProposal(info.lastInsertRowid);
  }

  function updateCommercialProposal(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    const current = getCommercialProposal(payload.id);
    const businessType = payload.business_type !== undefined ? normalizeBusinessType(payload.business_type) : current.business_type;
    const file = replaceStoredFile(current, payload);
    db.prepare(`
      UPDATE commercial_proposals
      SET number = @number,
          date = @date,
          amount = @amount,
          status = @status,
          business_type = @business_type,
          advance_percent = @advance_percent,
          comment = @comment,
          file_path = @file_path,
          original_filename = @original_filename
      WHERE id = @id
    `).run({
      id: payload.id,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      business_type: businessType,
      advance_percent: payload.advance_percent !== undefined ? normalizePercent(payload.advance_percent) : current.advance_percent,
      comment: payload.comment || "",
      file_path: file.file_path,
      original_filename: file.original_filename,
    });
    cascadeObjectBusinessType(current.object_id, businessType);
    return getCommercialProposal(payload.id);
  }

  function deleteCommercialProposal(id) {
    db.prepare("DELETE FROM commercial_proposals WHERE id = ?").run(id);
    return { ok: true };
  }

  function createContractFromProposal(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.comment_color || "pink", COMMENT_COLORS, "comment_color");

    const createFromProposal = db.transaction(() => {
      const proposal = getCommercialProposal(payload.proposal_id);
      if (!proposal) {
        throw new Error("КП не найдено");
      }

      const businessType = normalizeBusinessType(payload.business_type) || proposal.business_type || null;
      const advancePercent = payload.advance_percent !== undefined && payload.advance_percent !== ""
        ? normalizePercent(payload.advance_percent)
        : proposal.advance_percent;
      const file = storeFile(payload.sourceFilePath, payload.original_filename);
      const contractInfo = db.prepare(`
        INSERT INTO contracts
          (object_id, number, date, amount, status, payment_status, partial_payment_amount, business_type, advance_percent, comment, comment_color, file_path, original_filename, created_at)
        VALUES
          (@object_id, @number, @date, @amount, @status, 'unpaid', NULL, @business_type, @advance_percent, @comment, @comment_color, @file_path, @original_filename, @created_at)
      `).run({
        object_id: proposal.object_id,
        number: payload.number || "",
        date: payload.date || null,
        amount: normalizeMoney(payload.amount),
        status: payload.status,
        business_type: businessType,
        advance_percent: advancePercent,
        comment: payload.comment || proposal.comment || "",
        comment_color: payload.comment_color || "pink",
        file_path: file.file_path,
        original_filename: file.original_filename,
        created_at: now(),
      });
      cascadeObjectBusinessType(proposal.object_id, businessType);

      db.prepare(`
        INSERT INTO secondary_documents
          (parent_type, parent_id, doc_type, number, date, amount, status, payment_status, partial_payment_amount, file_path, original_filename, created_at)
        VALUES
          ('contract', @parent_id, 'commercial_proposal', @number, @date, @amount, @status, 'unpaid', NULL, @file_path, @original_filename, @created_at)
      `).run({
        parent_id: contractInfo.lastInsertRowid,
        number: proposal.number || "",
        date: proposal.date || null,
        amount: normalizeMoney(proposal.amount),
        status: proposal.status,
        file_path: proposal.file_path || null,
        original_filename: proposal.original_filename || null,
        created_at: now(),
      });

      db.prepare("DELETE FROM commercial_proposals WHERE id = ?").run(proposal.id);
      return getContract(contractInfo.lastInsertRowid);
    });

    return createFromProposal();
  }

  function createContract(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.comment_color || "pink", COMMENT_COLORS, "comment_color");
    const businessType = normalizeBusinessType(payload.business_type);
    const file = storeFile(payload.sourceFilePath, payload.original_filename);
    const info = db.prepare(`
      INSERT INTO contracts
        (object_id, number, date, amount, status, payment_status, partial_payment_amount, business_type, advance_percent, comment, comment_color, file_path, original_filename, created_at)
      VALUES
        (@object_id, @number, @date, @amount, @status, 'unpaid', NULL, @business_type, @advance_percent, @comment, @comment_color, @file_path, @original_filename, @created_at)
    `).run({
      object_id: payload.object_id,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      business_type: businessType,
      advance_percent: normalizePercent(payload.advance_percent),
      comment: payload.comment || "",
      comment_color: payload.comment_color || "pink",
      file_path: file.file_path,
      original_filename: file.original_filename,
      created_at: now(),
    });
    cascadeObjectBusinessType(payload.object_id, businessType);
    return getContract(info.lastInsertRowid);
  }

  function updateContract(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.comment_color || "pink", COMMENT_COLORS, "comment_color");
    const current = getContract(payload.id);
    const businessType = payload.business_type !== undefined ? normalizeBusinessType(payload.business_type) : current.business_type;
    const file = replaceStoredFile(current, payload);
    db.prepare(`
      UPDATE contracts
      SET number = @number,
          date = @date,
          amount = @amount,
          status = @status,
          business_type = @business_type,
          advance_percent = @advance_percent,
          comment = @comment,
          comment_color = @comment_color,
          file_path = @file_path,
          original_filename = @original_filename
      WHERE id = @id
    `).run({
      id: payload.id,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      business_type: businessType,
      advance_percent: payload.advance_percent !== undefined ? normalizePercent(payload.advance_percent) : current.advance_percent,
      comment: payload.comment || "",
      comment_color: payload.comment_color || "pink",
      file_path: file.file_path,
      original_filename: file.original_filename,
    });
    cascadeObjectBusinessType(current.object_id, businessType);
    return getContract(payload.id);
  }

  function deleteContract(id) {
    db.prepare("DELETE FROM contracts WHERE id = ?").run(id);
    return { ok: true };
  }

  function createAnnex(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    const contract = db.prepare("SELECT object_id FROM contracts WHERE id = ?").get(payload.contract_id);
    if (!contract) throw new Error("Договор не найден");
    const number = String(payload.number ?? "").trim() || nextAnnexNumber(db, contract.object_id);
    const file = storeFile(payload.sourceFilePath, payload.original_filename);
    const info = db.prepare(`
      INSERT INTO annexes
        (contract_id, number, date, amount, status, payment_status, partial_payment_amount, advance_percent, file_path, original_filename, created_at)
      VALUES
        (@contract_id, @number, @date, @amount, @status, 'unpaid', NULL, @advance_percent, @file_path, @original_filename, @created_at)
    `).run({
      contract_id: payload.contract_id,
      number,
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      advance_percent: normalizePercent(payload.advance_percent),
      file_path: file.file_path,
      original_filename: file.original_filename,
      created_at: now(),
    });
    return getAnnex(info.lastInsertRowid);
  }

  function updateAnnex(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    const current = getAnnex(payload.id);
    const file = replaceStoredFile(current, payload);
    db.prepare(`
      UPDATE annexes
      SET number = @number,
          date = @date,
          amount = @amount,
          status = @status,
          advance_percent = @advance_percent,
          file_path = @file_path,
          original_filename = @original_filename
      WHERE id = @id
    `).run({
      id: payload.id,
      number: payload.number !== undefined ? String(payload.number ?? "").trim() : current.number,
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      advance_percent: payload.advance_percent !== undefined ? normalizePercent(payload.advance_percent) : current.advance_percent,
      file_path: file.file_path,
      original_filename: file.original_filename,
    });
    return getAnnex(payload.id);
  }

  function deleteAnnex(id) {
    db.prepare("DELETE FROM annexes WHERE id = ?").run(id);
    return { ok: true };
  }

  function createSecondaryDocument(payload) {
    assertEnum(payload.parent_type, ["contract", "annex"], "parent_type");
    assertEnum(payload.doc_type, DOC_TYPES, "doc_type");
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    const file = storeFile(payload.sourceFilePath, payload.original_filename);
    const info = db.prepare(`
      INSERT INTO secondary_documents
        (parent_type, parent_id, doc_type, number, date, amount, status, payment_status, partial_payment_amount, file_path, original_filename, created_at)
      VALUES
        (@parent_type, @parent_id, @doc_type, @number, @date, @amount, @status, @payment_status, @partial_payment_amount, @file_path, @original_filename, @created_at)
    `).run({
      parent_type: payload.parent_type,
      parent_id: payload.parent_id,
      doc_type: payload.doc_type,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
      partial_payment_amount: paymentPartialAmount(payload),
      file_path: file.file_path,
      original_filename: file.original_filename,
      created_at: now(),
    });
    return getSecondaryDocument(info.lastInsertRowid);
  }

  function updateSecondaryDocument(payload) {
    assertEnum(payload.doc_type, DOC_TYPES, "doc_type");
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    const current = getSecondaryDocument(payload.id);
    const file = replaceStoredFile(current, payload);
    db.prepare(`
      UPDATE secondary_documents
      SET doc_type = @doc_type,
          number = @number,
          date = @date,
          amount = @amount,
          status = @status,
          payment_status = @payment_status,
          partial_payment_amount = @partial_payment_amount,
          file_path = @file_path,
          original_filename = @original_filename
      WHERE id = @id
    `).run({
      id: payload.id,
      doc_type: payload.doc_type,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
      partial_payment_amount: paymentPartialAmount(payload),
      file_path: file.file_path,
      original_filename: file.original_filename,
    });
    return getSecondaryDocument(payload.id);
  }

  function deleteSecondaryDocument(id) {
    db.prepare("DELETE FROM secondary_documents WHERE id = ?").run(id);
    return { ok: true };
  }

  function exportAllData(targetPath) {
    const zip = new AdmZip();
    const counts = {};

    zip.addFile("manifest.json", Buffer.from(JSON.stringify({
      app: "GureevDoc",
      version: 1,
      exported_at: now(),
      metadata: Object.keys(TABLE_COLUMNS).map((table) => `metadata/${table}.csv`),
    }, null, 2), "utf8"));

    for (const table of Object.keys(TABLE_COLUMNS)) {
      let rows = tableRows(table).map((row) => ({ ...row }));
      if (table === "contracts" || table === "annexes") {
        rows = rows.map((row) => withComputedPayment(row, table === "contracts" ? "contract" : "annex"));
      }
      counts[table] = rows.length;

      if (FILE_TABLES.includes(table)) {
        for (const row of rows) {
          row.archive_file_path = "";
          if (row.file_path && fs.existsSync(row.file_path)) {
            row.archive_file_path = makeArchiveFilePath(table, row);
            zip.addFile(row.archive_file_path, fs.readFileSync(row.file_path));
          }
        }
      }

      zip.addFile(`metadata/${table}.csv`, Buffer.from(csvFor(table, rows), "utf8"));
    }

    zip.writeZip(targetPath);
    return { ok: true, path: targetPath, counts };
  }

  function importAllData(sourcePath) {
    const zip = new AdmZip(sourcePath);
    const rawRows = {
      objects: parseCsvEntry(zip, "metadata/objects.csv"),
      commercial_proposals: parseCsvEntry(zip, "metadata/commercial_proposals.csv"),
      contracts: parseCsvEntry(zip, "metadata/contracts.csv"),
      annexes: parseCsvEntry(zip, "metadata/annexes.csv"),
      secondary_documents: parseCsvEntry(zip, "metadata/secondary_documents.csv"),
    };

    let counts = {};

    const applyImport = db.transaction(() => {
      db.prepare("DELETE FROM secondary_documents").run();
      db.prepare("DELETE FROM annexes").run();
      db.prepare("DELETE FROM contracts").run();
      db.prepare("DELETE FROM commercial_proposals").run();
      db.prepare("DELETE FROM objects").run();
      clearFilesDir();

      const objects = rawRows.objects.map((row) => normalizeImportedRow(row, "objects", zip));
      const commercialProposals = rawRows.commercial_proposals.map((row) => normalizeImportedRow(row, "commercial_proposals", zip));
      const contracts = rawRows.contracts.map((row) => normalizeImportedRow(row, "contracts", zip));
      const annexes = rawRows.annexes.map((row) => normalizeImportedRow(row, "annexes", zip));
      const secondaryDocuments = rawRows.secondary_documents.map((row) => normalizeImportedRow(row, "secondary_documents", zip));

      insertRows("objects", objects);
      insertRows("commercial_proposals", commercialProposals);
      insertRows("contracts", contracts);
      insertRows("annexes", annexes);
      insertRows("secondary_documents", secondaryDocuments);
      backfillAnnexNumbers(db);

      counts = {
        objects: objects.length,
        commercial_proposals: commercialProposals.length,
        contracts: contracts.length,
        annexes: annexes.length,
        secondary_documents: secondaryDocuments.length,
      };
    });

    applyImport();

    return { ok: true, counts };
  }

  function getContract(id) {
    return withComputedPayment(db.prepare("SELECT * FROM contracts WHERE id = ?").get(id), "contract");
  }

  function getCommercialProposal(id) {
    return db.prepare("SELECT * FROM commercial_proposals WHERE id = ?").get(id);
  }

  function getAnnex(id) {
    return withComputedPayment(db.prepare("SELECT * FROM annexes WHERE id = ?").get(id), "annex");
  }

  function getSecondaryDocument(id) {
    return db.prepare("SELECT * FROM secondary_documents WHERE id = ?").get(id);
  }

  function getObjectDetails(id) {
    const object = db.prepare("SELECT * FROM objects WHERE id = ?").get(id);
    if (!object) return null;

    object.commercial_proposals = db.prepare("SELECT * FROM commercial_proposals WHERE object_id = ? ORDER BY date DESC, created_at DESC").all(id);

    const contracts = db.prepare("SELECT * FROM contracts WHERE object_id = ? ORDER BY date DESC, created_at DESC").all(id);
    const annexStmt = db.prepare("SELECT * FROM annexes WHERE contract_id = ? ORDER BY date DESC, created_at DESC");
    const docsForContract = db.prepare("SELECT * FROM secondary_documents WHERE parent_type = 'contract' AND parent_id = ? ORDER BY date DESC, created_at DESC");
    const docsForAnnex = db.prepare("SELECT * FROM secondary_documents WHERE parent_type = 'annex' AND parent_id = ? ORDER BY date DESC, created_at DESC");

    object.contracts = contracts.map((contract) => {
      const annexes = annexStmt.all(contract.id).map((annex) => ({
        ...withComputedPayment(annex, "annex"),
        business_type: contract.business_type,
        documents: docsForAnnex.all(annex.id).map((doc) => ({ ...doc, business_type: contract.business_type })),
      }));

      return {
        ...withComputedPayment(contract, "contract"),
        annexes,
        documents: docsForContract.all(contract.id).map((doc) => ({ ...doc, business_type: contract.business_type })),
      };
    });

    return object;
  }

  function listRegistryDocuments() {
    const rows = db.prepare(`
      SELECT * FROM (
        SELECT
          'commercial_proposal' AS source_type,
          cp.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          NULL AS contract_id,
          NULL AS contract_number,
          NULL AS annex_id,
          NULL AS annex_label,
          'commercial_proposal' AS doc_type,
          cp.number AS document_number,
          'primary' AS category,
          cp.business_type,
          cp.date,
          cp.amount,
          cp.status,
          'unpaid' AS payment_status,
          NULL AS partial_payment_amount,
          cp.file_path,
          cp.original_filename
        FROM commercial_proposals cp
        JOIN objects o ON o.id = cp.object_id

        UNION ALL

        SELECT
          'contract' AS source_type,
          c.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          NULL AS annex_id,
          NULL AS annex_label,
          'contract' AS doc_type,
          c.number AS document_number,
          'primary' AS category,
          c.business_type,
          c.date,
          c.amount,
          c.status,
          c.payment_status,
          c.partial_payment_amount,
          c.file_path,
          c.original_filename
        FROM contracts c
        JOIN objects o ON o.id = c.object_id

        UNION ALL

        SELECT
          'annex' AS source_type,
          a.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          a.id AS annex_id,
          TRIM('ДС ' || a.number) AS annex_label,
          'annex' AS doc_type,
          a.number AS document_number,
          'primary' AS category,
          c.business_type,
          a.date,
          a.amount,
          a.status,
          a.payment_status,
          a.partial_payment_amount,
          a.file_path,
          a.original_filename
        FROM annexes a
        JOIN contracts c ON c.id = a.contract_id
        JOIN objects o ON o.id = c.object_id

        UNION ALL

        SELECT
          'secondary' AS source_type,
          sd.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          NULL AS annex_id,
          NULL AS annex_label,
          sd.doc_type,
          sd.number AS document_number,
          'secondary' AS category,
          c.business_type,
          sd.date,
          sd.amount,
          sd.status,
          sd.payment_status,
          sd.partial_payment_amount,
          sd.file_path,
          sd.original_filename
        FROM secondary_documents sd
        JOIN contracts c ON sd.parent_type = 'contract' AND sd.parent_id = c.id
        JOIN objects o ON o.id = c.object_id

        UNION ALL

        SELECT
          'secondary' AS source_type,
          sd.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          a.id AS annex_id,
          TRIM('ДС ' || a.number) AS annex_label,
          sd.doc_type,
          sd.number AS document_number,
          'secondary' AS category,
          c.business_type,
          sd.date,
          sd.amount,
          sd.status,
          sd.payment_status,
          sd.partial_payment_amount,
          sd.file_path,
          sd.original_filename
        FROM secondary_documents sd
        JOIN annexes a ON sd.parent_type = 'annex' AND sd.parent_id = a.id
        JOIN contracts c ON c.id = a.contract_id
        JOIN objects o ON o.id = c.object_id
      )
      ORDER BY date DESC, source_id DESC
    `).all();

    return rows.map((row) => {
      if (row.source_type === "contract") {
        return { ...row, ...deriveDocumentPayment(row.amount, sumPaidInvoices("contract", row.source_id)) };
      }
      if (row.source_type === "annex") {
        return { ...row, ...deriveDocumentPayment(row.amount, sumPaidInvoices("annex", row.annex_id)) };
      }
      return row;
    });
  }

  return {
    listObjects,
    getObjectDetails,
    createObject,
    updateObject,
    deleteObject,
    createCommercialProposal,
    updateCommercialProposal,
    deleteCommercialProposal,
    createContractFromProposal,
    createContract,
    updateContract,
    deleteContract,
    createAnnex,
    updateAnnex,
    deleteAnnex,
    createSecondaryDocument,
    updateSecondaryDocument,
    deleteSecondaryDocument,
    listRegistryDocuments,
    seedDevelopmentData,
    exportAllData,
    importAllData,
  };
}

function migrate(db) {
  const secondaryDocTypesSql = "'commercial_proposal', 'act', 'invoice', 'invoice_facture', 'report', 'outgoing_letter', 'order', 'waybill'";

  db.exec(`
    CREATE TABLE IF NOT EXISTS objects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      customer TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      comment TEXT NOT NULL DEFAULT '',
      folder_created_date TEXT,
      is_ooo INTEGER NOT NULL DEFAULT 0,
      is_ip INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS commercial_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      object_id INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
      number TEXT NOT NULL DEFAULT '',
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      business_type TEXT CHECK (business_type IN ('ooo', 'ip')),
      advance_percent REAL,
      comment TEXT NOT NULL DEFAULT '',
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      object_id INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
      number TEXT NOT NULL DEFAULT '',
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
      partial_payment_amount REAL,
      business_type TEXT CHECK (business_type IN ('ooo', 'ip')),
      advance_percent REAL,
      comment TEXT NOT NULL DEFAULT '',
      comment_color TEXT NOT NULL DEFAULT 'pink' CHECK (comment_color IN ('pink', 'violet')),
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS annexes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      number TEXT NOT NULL DEFAULT '',
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
      partial_payment_amount REAL,
      advance_percent REAL,
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS secondary_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_type TEXT NOT NULL CHECK (parent_type IN ('contract', 'annex')),
      parent_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL CHECK (doc_type IN ('commercial_proposal', 'act', 'invoice', 'invoice_facture', 'report', 'outgoing_letter', 'order', 'waybill')),
      number TEXT NOT NULL DEFAULT '',
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
      partial_payment_amount REAL,
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_proposals_object ON commercial_proposals(object_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_object ON contracts(object_id);
    CREATE INDEX IF NOT EXISTS idx_annexes_contract ON annexes(contract_id);
    CREATE INDEX IF NOT EXISTS idx_secondary_parent ON secondary_documents(parent_type, parent_id);
  `);

  addColumnIfMissing(db, "objects", "customer", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "objects", "address", "TEXT NOT NULL DEFAULT ''");
  rebuildSecondaryDocumentsIfNeeded(db, secondaryDocTypesSql);
  addColumnIfMissing(db, "contracts", "partial_payment_amount", "REAL");
  addColumnIfMissing(db, "annexes", "partial_payment_amount", "REAL");
  addColumnIfMissing(db, "secondary_documents", "number", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "secondary_documents", "partial_payment_amount", "REAL");
  addColumnIfMissing(db, "objects", "is_ooo", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "objects", "is_ip", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "contracts", "business_type", "TEXT");
  addColumnIfMissing(db, "commercial_proposals", "business_type", "TEXT");
  addColumnIfMissing(db, "commercial_proposals", "advance_percent", "REAL");
  addColumnIfMissing(db, "contracts", "advance_percent", "REAL");
  addColumnIfMissing(db, "annexes", "advance_percent", "REAL");
  if (addColumnIfMissing(db, "annexes", "number", "TEXT NOT NULL DEFAULT ''")) {
    // Before 0.3.3 the ДС number was the global row id; renumber per object.
    backfillAnnexNumbers(db);
  }
}

function annexNumberValue(number) {
  const value = Number.parseInt(String(number ?? "").trim(), 10);
  return Number.isNaN(value) ? 0 : value;
}

function nextAnnexNumber(db, objectId) {
  const rows = db.prepare(`
    SELECT a.number FROM annexes a
    JOIN contracts c ON c.id = a.contract_id
    WHERE c.object_id = ?
  `).all(objectId);
  return String(rows.reduce((max, row) => Math.max(max, annexNumberValue(row.number)), 0) + 1);
}

function backfillAnnexNumbers(db) {
  const rows = db.prepare(`
    SELECT a.id, c.object_id FROM annexes a
    JOIN contracts c ON c.id = a.contract_id
    WHERE a.number = ''
    ORDER BY a.id
  `).all();
  const update = db.prepare("UPDATE annexes SET number = ? WHERE id = ?");
  for (const row of rows) {
    update.run(nextAnnexNumber(db, row.object_id), row.id);
  }
}

function addColumnIfMissing(db, table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    return true;
  }
  return false;
}

function rebuildSecondaryDocumentsIfNeeded(db, docTypesSql) {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'secondary_documents'").get();
  if (!table || table.sql.includes("commercial_proposal")) return;
  const columns = db.prepare("PRAGMA table_info(secondary_documents)").all();
  const hasNumber = columns.some((item) => item.name === "number");
  const hasPartialPaymentAmount = columns.some((item) => item.name === "partial_payment_amount");
  const numberSelect = hasNumber ? "number" : "''";
  const partialPaymentSelect = hasPartialPaymentAmount ? "partial_payment_amount" : "NULL";

  db.pragma("foreign_keys = OFF");
  db.exec(`
    ALTER TABLE secondary_documents RENAME TO secondary_documents_old;

    CREATE TABLE secondary_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_type TEXT NOT NULL CHECK (parent_type IN ('contract', 'annex')),
      parent_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL CHECK (doc_type IN (${docTypesSql})),
      number TEXT NOT NULL DEFAULT '',
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
      partial_payment_amount REAL,
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    INSERT INTO secondary_documents
      (id, parent_type, parent_id, doc_type, number, date, amount, status, payment_status, partial_payment_amount, file_path, original_filename, created_at)
    SELECT
      id, parent_type, parent_id, doc_type, ${numberSelect}, date, amount, status, payment_status, ${partialPaymentSelect}, file_path, original_filename, created_at
    FROM secondary_documents_old;

    DROP TABLE secondary_documents_old;
    CREATE INDEX IF NOT EXISTS idx_secondary_parent ON secondary_documents(parent_type, parent_id);
  `);
  db.pragma("foreign_keys = ON");
}

module.exports = { createStore };
