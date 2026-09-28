const STORAGE_KEY = "gureevdoc-demo-state-022-biztype";

const sampleState = {
  nextId: 25,
  objects: [
    {
      id: 1,
      name: "ЖК Северный квартал",
      customer: "ООО Северстрой",
      address: "Москва, Северный проспект, 14",
      comment: "Монолит, 2 очередь. Проверить закрывающие за июль.",
      folder_created_date: "2026-07-18",
      is_ooo: 1,
      is_ip: 0,
      created_at: "2026-07-18T09:00:00.000Z",
    },
    {
      id: 2,
      name: "Складской комплекс Восток",
      customer: "АО Восток Девелопмент",
      address: "Московская область, промзона Восточная",
      comment: "Генподряд, инженерные сети.",
      folder_created_date: "2026-06-02",
      is_ooo: 0,
      is_ip: 1,
      created_at: "2026-06-02T09:00:00.000Z",
    },
    {
      id: 9,
      name: "БЦ Гурьев Плаза",
      customer: "ООО Гурьев Плаза",
      address: "Москва, ул. Правды, 22",
      comment: "Отделка общественных зон, высокий приоритет.",
      folder_created_date: "2026-08-19",
      is_ooo: 1,
      is_ip: 1,
      created_at: "2026-08-19T09:00:00.000Z",
    },
    {
      id: 10,
      name: "Школа на Лесной",
      customer: "ГБУ Дирекция строительства",
      address: "Химки, ул. Лесная, 7",
      comment: "Тендерная стадия, ждём обратную связь по КП.",
      folder_created_date: "2026-09-03",
      is_ooo: 0,
      is_ip: 0,
      created_at: "2026-09-03T09:00:00.000Z",
    },
  ],
  commercial_proposals: [
    {
      id: 8,
      object_id: 1,
      number: "КП-21",
      date: "2026-08-28",
      amount: 3400000,
      status: "pending",
      business_type: "ooo",
      comment: "кровля",
      file_path: null,
      original_filename: "kp-21.pdf",
      created_at: "2026-08-28T09:00:00.000Z",
    },
    {
      id: 11,
      object_id: 10,
      number: "КП-44/26",
      date: "2026-09-08",
      amount: 5750000,
      status: "not_sent",
      business_type: null,
      comment: "тендер",
      file_path: null,
      original_filename: "kp-school-draft.pdf",
      created_at: "2026-09-08T09:00:00.000Z",
    },
    {
      id: 12,
      object_id: 9,
      number: "КП-39/26",
      date: "2026-08-24",
      amount: 2100000,
      status: "approved",
      business_type: "ip",
      comment: "витражи",
      file_path: null,
      original_filename: "kp-vitraji.pdf",
      created_at: "2026-08-24T09:00:00.000Z",
    },
  ],
  contracts: [
    {
      id: 3,
      object_id: 1,
      number: "14-К/26",
      date: "2026-07-21",
      amount: 18400000,
      status: "approved",
      payment_status: "partial",
      partial_payment_amount: 7000000,
      business_type: "ooo",
      comment: "фасад",
      comment_color: "pink",
      file_path: null,
      original_filename: null,
      created_at: "2026-07-21T09:00:00.000Z",
    },
    {
      id: 4,
      object_id: 2,
      number: "08-В/26",
      date: "2026-06-07",
      amount: 9200000,
      status: "pending",
      payment_status: "unpaid",
      partial_payment_amount: null,
      business_type: "ip",
      comment: "сети",
      comment_color: "violet",
      file_path: null,
      original_filename: null,
      created_at: "2026-06-07T09:00:00.000Z",
    },
    {
      id: 13,
      object_id: 9,
      number: "31-ОЗ/26",
      date: "2026-08-30",
      amount: 12600000,
      status: "approved",
      payment_status: "paid",
      partial_payment_amount: null,
      business_type: "ooo",
      comment: "отделка",
      comment_color: "violet",
      file_path: null,
      original_filename: "contract-31-oz-26.pdf",
      created_at: "2026-08-30T09:00:00.000Z",
    },
    {
      id: 14,
      object_id: 10,
      number: "без номера",
      date: "2026-09-12",
      amount: 5750000,
      status: "pending",
      payment_status: "partial",
      partial_payment_amount: 1500000,
      business_type: null,
      comment: "срочно",
      comment_color: "pink",
      file_path: null,
      original_filename: "contract-school-scan.pdf",
      created_at: "2026-09-12T09:00:00.000Z",
    },
  ],
  annexes: [
    {
      id: 5,
      contract_id: 3,
      number: "1",
      date: "2026-08-02",
      amount: 1260000,
      status: "approved",
      payment_status: "paid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: null,
      created_at: "2026-08-02T09:00:00.000Z",
    },
    {
      id: 15,
      contract_id: 13,
      number: "1",
      date: "2026-09-05",
      amount: 850000,
      status: "pending",
      payment_status: "partial",
      partial_payment_amount: 300000,
      file_path: null,
      original_filename: "ds-materialy.pdf",
      created_at: "2026-09-05T09:00:00.000Z",
    },
    {
      id: 16,
      contract_id: 14,
      number: "1",
      date: "2026-09-14",
      amount: 420000,
      status: "not_sent",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "ds-avans.pdf",
      created_at: "2026-09-14T09:00:00.000Z",
    },
  ],
  secondary_documents: [
    {
      id: 6,
      parent_type: "contract",
      parent_id: 3,
      doc_type: "invoice",
      number: "С-42",
      date: "2026-08-10",
      amount: 4600000,
      status: "na",
      payment_status: "partial",
      partial_payment_amount: 1200000,
      file_path: null,
      original_filename: "schet-14k-avgust.pdf",
      created_at: "2026-08-10T09:00:00.000Z",
    },
    {
      id: 7,
      parent_type: "annex",
      parent_id: 5,
      doc_type: "act",
      number: "А-17",
      date: "2026-08-22",
      amount: 1260000,
      status: "not_sent",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "akt-ds-1.pdf",
      created_at: "2026-08-22T09:00:00.000Z",
    },
    {
      id: 17,
      parent_type: "contract",
      parent_id: 3,
      doc_type: "commercial_proposal",
      number: "КП-18/26",
      date: "2026-07-12",
      amount: 18400000,
      status: "approved",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "kp-pereneseno-pod-dogovor.pdf",
      created_at: "2026-07-12T09:00:00.000Z",
    },
    {
      id: 18,
      parent_type: "contract",
      parent_id: 13,
      doc_type: "invoice_facture",
      number: "СФ-118",
      date: "2026-09-02",
      amount: 12600000,
      status: "na",
      payment_status: "paid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "schet-faktura-118.pdf",
      created_at: "2026-09-02T09:00:00.000Z",
    },
    {
      id: 19,
      parent_type: "contract",
      parent_id: 13,
      doc_type: "outgoing_letter",
      number: "ИСХ-77",
      date: "2026-09-07",
      amount: null,
      status: "pending",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "letter-change-deadline.pdf",
      created_at: "2026-09-07T09:00:00.000Z",
    },
    {
      id: 20,
      parent_type: "annex",
      parent_id: 15,
      doc_type: "invoice",
      number: "СЧ-204",
      date: "2026-09-06",
      amount: 850000,
      status: "na",
      payment_status: "partial",
      partial_payment_amount: 300000,
      file_path: null,
      original_filename: "invoice-ds-materialy.pdf",
      created_at: "2026-09-06T09:00:00.000Z",
    },
    {
      id: 21,
      parent_type: "annex",
      parent_id: 15,
      doc_type: "act",
      number: "АКТ-56",
      date: "2026-09-11",
      amount: 850000,
      status: "approved",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "akt-56.pdf",
      created_at: "2026-09-11T09:00:00.000Z",
    },
    {
      id: 22,
      parent_type: "contract",
      parent_id: 14,
      doc_type: "waybill",
      number: "ТН-009",
      date: "2026-09-13",
      amount: 240000,
      status: "not_sent",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "nakladnaya-009.pdf",
      created_at: "2026-09-13T09:00:00.000Z",
    },
    {
      id: 23,
      parent_type: "annex",
      parent_id: 16,
      doc_type: "order",
      number: "ПР-12",
      date: "2026-09-15",
      amount: null,
      status: "approved",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "prikaz-12.pdf",
      created_at: "2026-09-15T09:00:00.000Z",
    },
    {
      id: 24,
      parent_type: "contract",
      parent_id: 4,
      doc_type: "report",
      number: "ОТЧ-03",
      date: "2026-08-31",
      amount: null,
      status: "pending",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "weekly-report-03.pdf",
      created_at: "2026-08-31T09:00:00.000Z",
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleState));
    return clone(sampleState);
  }
  const state = JSON.parse(raw);
  state.commercial_proposals = (state.commercial_proposals || []).map((proposal) => ({
    business_type: null,
    advance_percent: null,
    ...proposal,
  }));
  state.contracts = (state.contracts || []).map((contract) => ({
    partial_payment_amount: null,
    business_type: null,
    advance_percent: null,
    ...contract,
  }));
  state.annexes = (state.annexes || []).map((annex) => ({
    partial_payment_amount: null,
    advance_percent: null,
    number: "",
    ...annex,
  }));
  for (const annex of state.annexes) {
    if (annex.number === "") annex.number = nextAnnexNumber(state, annexObjectId(state, annex));
  }
  state.secondary_documents = (state.secondary_documents || []).map((document) => ({
    number: "",
    partial_payment_amount: null,
    ...document,
  }));
  state.objects = (state.objects || []).map((object) => ({
    customer: "",
    address: "",
    is_ooo: 0,
    is_ip: 0,
    ...object,
  }));
  return state;
}

function setState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function annexObjectId(state, annex) {
  return state.contracts.find((contract) => contract.id === annex.contract_id)?.object_id;
}

function nextAnnexNumber(state, objectId) {
  const numbers = state.annexes
    .filter((annex) => annexObjectId(state, annex) === objectId)
    .map((annex) => Number.parseInt(String(annex.number ?? "").trim(), 10))
    .filter((value) => !Number.isNaN(value));
  return String(Math.max(0, ...numbers) + 1);
}

function nextId(state) {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function now() {
  return new Date().toISOString();
}

function invoicePaidAmount(invoice) {
  if (invoice.payment_status === "paid") return invoice.amount || 0;
  if (invoice.payment_status === "partial") return invoice.partial_payment_amount || 0;
  return 0;
}

function sumPaidInvoices(state, parentType, parentId) {
  return state.secondary_documents
    .filter((doc) => doc.parent_type === parentType && doc.parent_id === parentId && doc.doc_type === "invoice")
    .reduce((sum, invoice) => sum + invoicePaidAmount(invoice), 0);
}

function deriveDocumentPayment(amount, paidSum) {
  if (paidSum <= 0) return { payment_status: "unpaid", partial_payment_amount: null };
  if (amount && paidSum >= amount) return { payment_status: "paid", partial_payment_amount: null };
  return { payment_status: "partial", partial_payment_amount: paidSum };
}

function withComputedPayment(state, row, parentType) {
  if (!row) return row;
  const paidSum = sumPaidInvoices(state, parentType, row.id);
  return { ...row, ...deriveDocumentPayment(row.amount, paidSum) };
}

function normalizePercent(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function paymentPartialAmount(payload) {
  if (payload.payment_status === "partial") return Number(payload.partial_payment_amount || 0) || null;
  if (payload.payment_status === "paid") return payload.amount === "" ? null : Number(payload.amount) || null;
  return null;
}

function enrichObject(state, object) {
  const contracts = state.contracts
    .filter((contract) => contract.object_id === object.id)
    .map((contract) => {
      const annexes = state.annexes
        .filter((annex) => annex.contract_id === contract.id)
        .map((annex) => ({
          ...withComputedPayment(state, annex, "annex"),
          business_type: contract.business_type,
          documents: state.secondary_documents
            .filter((doc) => doc.parent_type === "annex" && doc.parent_id === annex.id)
            .map((doc) => ({ ...doc, business_type: contract.business_type })),
        }));

      return {
        ...withComputedPayment(state, contract, "contract"),
        annexes,
        documents: state.secondary_documents
          .filter((doc) => doc.parent_type === "contract" && doc.parent_id === contract.id)
          .map((doc) => ({ ...doc, business_type: contract.business_type })),
      };
    });

  const commercial_proposals = state.commercial_proposals.filter((proposal) => proposal.object_id === object.id);
  return { ...object, commercial_proposals, contracts };
}

function cascadeObjectBusinessType(state, objectId, businessType) {
  const object = state.objects.find((item) => item.id === Number(objectId));
  if (!object) return;
  if (businessType === "ooo" && !object.is_ooo) object.is_ooo = 1;
  if (businessType === "ip" && !object.is_ip) object.is_ip = 1;
}

function listRegistryDocumentsFromState(state) {
  const rows = [];
  for (const object of state.objects) {
    const proposals = state.commercial_proposals.filter((proposal) => proposal.object_id === object.id);
    for (const proposal of proposals) {
      rows.push({
        source_type: "commercial_proposal",
        source_id: proposal.id,
        object_id: object.id,
        object_name: object.name,
        contract_id: null,
        contract_number: null,
        annex_id: null,
        annex_label: null,
        doc_type: "commercial_proposal",
        category: "primary",
        business_type: proposal.business_type || null,
        date: proposal.date,
        amount: proposal.amount,
        status: proposal.status,
        payment_status: "unpaid",
        partial_payment_amount: null,
        document_number: proposal.number,
        file_path: proposal.file_path,
        original_filename: proposal.original_filename,
      });
    }

    const contracts = state.contracts.filter((contract) => contract.object_id === object.id);
    for (const contract of contracts) {
      rows.push({
        source_type: "contract",
        source_id: contract.id,
        object_id: object.id,
        object_name: object.name,
        contract_id: contract.id,
        contract_number: contract.number,
        annex_id: null,
        annex_label: null,
        doc_type: "contract",
        category: "primary",
        business_type: contract.business_type || null,
        date: contract.date,
        amount: contract.amount,
        status: contract.status,
        payment_status: contract.payment_status,
        partial_payment_amount: contract.partial_payment_amount,
        document_number: contract.number,
        file_path: contract.file_path,
        original_filename: contract.original_filename,
      });

      const annexes = state.annexes.filter((annex) => annex.contract_id === contract.id);
      for (const annex of annexes) {
        rows.push({
          source_type: "annex",
          source_id: annex.id,
          object_id: object.id,
          object_name: object.name,
          contract_id: contract.id,
          contract_number: contract.number,
          annex_id: annex.id,
          annex_label: `ДС ${annex.number}`.trim(),
          doc_type: "annex",
          category: "primary",
          business_type: contract.business_type || null,
          date: annex.date,
          amount: annex.amount,
          status: annex.status,
          payment_status: annex.payment_status,
          partial_payment_amount: annex.partial_payment_amount,
          document_number: annex.number,
          file_path: annex.file_path,
          original_filename: annex.original_filename,
        });
      }

      const directDocs = state.secondary_documents.filter((doc) => doc.parent_type === "contract" && doc.parent_id === contract.id);
      for (const doc of directDocs) {
        rows.push({
          ...doc,
          source_type: "secondary",
          source_id: doc.id,
          object_id: object.id,
          object_name: object.name,
          contract_id: contract.id,
          contract_number: contract.number,
          annex_id: null,
          annex_label: null,
          document_number: doc.number || "",
          category: "secondary",
          business_type: contract.business_type || null,
        });
      }

      for (const annex of annexes) {
        const annexDocs = state.secondary_documents.filter((doc) => doc.parent_type === "annex" && doc.parent_id === annex.id);
        for (const doc of annexDocs) {
          rows.push({
            ...doc,
            source_type: "secondary",
            source_id: doc.id,
            object_id: object.id,
            object_name: object.name,
            contract_id: contract.id,
            contract_number: contract.number,
            annex_id: annex.id,
            annex_label: `ДС ${annex.number}`.trim(),
            document_number: doc.number || "",
            category: "secondary",
            business_type: contract.business_type || null,
          });
        }
      }
    }
  }
  const computedRows = rows.map((row) => {
    if (row.source_type === "contract") {
      return { ...row, ...deriveDocumentPayment(row.amount, sumPaidInvoices(state, "contract", row.source_id)) };
    }
    if (row.source_type === "annex") {
      return { ...row, ...deriveDocumentPayment(row.amount, sumPaidInvoices(state, "annex", row.annex_id)) };
    }
    return row;
  });
  return computedRows.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function makeMockApi() {
  return {
    async listObjects() {
      const state = getState();
      return state.objects.map((object) => {
        const contracts = state.contracts.filter((contract) => contract.object_id === object.id);
        const proposals = state.commercial_proposals.filter((proposal) => proposal.object_id === object.id);
        const annexes = state.annexes.filter((annex) => contracts.some((contract) => contract.id === annex.contract_id));
        const secondary = state.secondary_documents.filter((doc) => {
          if (doc.parent_type === "contract") return contracts.some((contract) => contract.id === doc.parent_id);
          return annexes.some((annex) => annex.id === doc.parent_id);
        });
        return {
          ...object,
          customer: object.customer || "",
          address: object.address || "",
          proposals_count: proposals.length,
          contracts_count: contracts.length,
          annexes_count: annexes.length,
          secondary_count: secondary.length,
        };
      });
    },
    async getObjectDetails(id) {
      const state = getState();
      const object = state.objects.find((item) => item.id === Number(id));
      return object ? enrichObject(state, object) : null;
    },
    async createObject(payload) {
      const state = getState();
      const object = {
        id: nextId(state),
        name: payload.name,
        customer: payload.customer || "",
        address: payload.address || "",
        comment: payload.comment || "",
        folder_created_date: payload.folder_created_date || null,
        is_ooo: payload.is_ooo ? 1 : 0,
        is_ip: payload.is_ip ? 1 : 0,
        created_at: now(),
      };
      state.objects.push(object);
      setState(state);
      return enrichObject(state, object);
    },
    async updateObject(payload) {
      const state = getState();
      const index = state.objects.findIndex((item) => item.id === Number(payload.id));
      if (index >= 0) state.objects[index] = { ...state.objects[index], ...payload };
      setState(state);
      return enrichObject(state, state.objects[index]);
    },
    async deleteObject(id) {
      const state = getState();
      const objectId = Number(id);
      const contracts = state.contracts.filter((contract) => contract.object_id === objectId).map((contract) => contract.id);
      const annexes = state.annexes.filter((annex) => contracts.includes(annex.contract_id)).map((annex) => annex.id);
      state.objects = state.objects.filter((object) => object.id !== objectId);
      state.commercial_proposals = state.commercial_proposals.filter((proposal) => proposal.object_id !== objectId);
      state.contracts = state.contracts.filter((contract) => contract.object_id !== objectId);
      state.annexes = state.annexes.filter((annex) => !contracts.includes(annex.contract_id));
      state.secondary_documents = state.secondary_documents.filter((doc) => {
        if (doc.parent_type === "contract") return !contracts.includes(doc.parent_id);
        return !annexes.includes(doc.parent_id);
      });
      setState(state);
      return { ok: true };
    },
    async createCommercialProposal(payload) {
      const state = getState();
      const proposal = { id: nextId(state), ...payload, created_at: now(), advance_percent: normalizePercent(payload.advance_percent), file_path: payload.sourceFilePath || null, original_filename: payload.original_filename || null };
      state.commercial_proposals.push(proposal);
      cascadeObjectBusinessType(state, proposal.object_id, proposal.business_type);
      setState(state);
      return proposal;
    },
    async updateCommercialProposal(payload) {
      const state = getState();
      const index = state.commercial_proposals.findIndex((proposal) => proposal.id === Number(payload.id));
      if (index >= 0) {
        state.commercial_proposals[index] = {
          ...state.commercial_proposals[index],
          number: payload.number || "",
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          business_type: payload.business_type !== undefined ? (payload.business_type || null) : state.commercial_proposals[index].business_type,
          advance_percent: payload.advance_percent !== undefined ? normalizePercent(payload.advance_percent) : state.commercial_proposals[index].advance_percent,
          comment: payload.comment || "",
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.commercial_proposals[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.commercial_proposals[index].original_filename,
        };
        cascadeObjectBusinessType(state, state.commercial_proposals[index].object_id, state.commercial_proposals[index].business_type);
      }
      setState(state);
      return state.commercial_proposals[index] || null;
    },
    async deleteCommercialProposal(id) {
      const state = getState();
      state.commercial_proposals = state.commercial_proposals.filter((proposal) => proposal.id !== Number(id));
      setState(state);
      return { ok: true };
    },
    async createContractFromProposal(payload) {
      const state = getState();
      const proposal = state.commercial_proposals.find((item) => item.id === Number(payload.proposal_id));
      if (!proposal) throw new Error("КП не найдено");
      const contract = {
        id: nextId(state),
        object_id: proposal.object_id,
        number: payload.number || "",
        date: payload.date || null,
        amount: payload.amount === "" ? null : Number(payload.amount),
        status: payload.status,
        payment_status: "unpaid",
        partial_payment_amount: null,
        business_type: payload.business_type || proposal.business_type || null,
        advance_percent: payload.advance_percent !== undefined && payload.advance_percent !== ""
          ? normalizePercent(payload.advance_percent)
          : proposal.advance_percent ?? null,
        comment: payload.comment || proposal.comment || "",
        comment_color: payload.comment_color || "pink",
        file_path: payload.sourceFilePath || null,
        original_filename: payload.original_filename || null,
        created_at: now(),
      };
      state.contracts.push(contract);
      cascadeObjectBusinessType(state, contract.object_id, contract.business_type);
      state.secondary_documents.push({
        id: nextId(state),
        parent_type: "contract",
        parent_id: contract.id,
        doc_type: "commercial_proposal",
        date: proposal.date,
        amount: proposal.amount,
        status: proposal.status,
        payment_status: "unpaid",
        partial_payment_amount: null,
        number: proposal.number || "",
        file_path: proposal.file_path,
        original_filename: proposal.original_filename,
        created_at: now(),
      });
      state.commercial_proposals = state.commercial_proposals.filter((item) => item.id !== proposal.id);
      setState(state);
      return withComputedPayment(state, contract, "contract");
    },
    async createContract(payload) {
      const state = getState();
      const contract = { id: nextId(state), ...payload, created_at: now(), payment_status: "unpaid", partial_payment_amount: null, file_path: payload.sourceFilePath || null, original_filename: payload.original_filename || null };
      contract.business_type = contract.business_type || null;
      contract.advance_percent = normalizePercent(contract.advance_percent);
      state.contracts.push(contract);
      cascadeObjectBusinessType(state, contract.object_id, contract.business_type);
      setState(state);
      return withComputedPayment(state, contract, "contract");
    },
    async updateContract(payload) {
      const state = getState();
      const index = state.contracts.findIndex((contract) => contract.id === Number(payload.id));
      if (index >= 0) {
        state.contracts[index] = {
          ...state.contracts[index],
          number: payload.number || "",
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          business_type: payload.business_type !== undefined ? (payload.business_type || null) : state.contracts[index].business_type,
          advance_percent: payload.advance_percent !== undefined ? normalizePercent(payload.advance_percent) : state.contracts[index].advance_percent,
          comment: payload.comment || "",
          comment_color: payload.comment_color || "pink",
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.contracts[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.contracts[index].original_filename,
        };
        cascadeObjectBusinessType(state, state.contracts[index].object_id, state.contracts[index].business_type);
      }
      setState(state);
      return index >= 0 ? withComputedPayment(state, state.contracts[index], "contract") : null;
    },
    async deleteContract(id) {
      const state = getState();
      const contractId = Number(id);
      const annexes = state.annexes.filter((annex) => annex.contract_id === contractId).map((annex) => annex.id);
      state.contracts = state.contracts.filter((contract) => contract.id !== contractId);
      state.annexes = state.annexes.filter((annex) => annex.contract_id !== contractId);
      state.secondary_documents = state.secondary_documents.filter((doc) => {
        if (doc.parent_type === "contract") return doc.parent_id !== contractId;
        return !annexes.includes(doc.parent_id);
      });
      setState(state);
      return { ok: true };
    },
    async createAnnex(payload) {
      const state = getState();
      const number = String(payload.number ?? "").trim() || nextAnnexNumber(state, annexObjectId(state, { contract_id: Number(payload.contract_id) }));
      const annex = { id: nextId(state), ...payload, number, created_at: now(), payment_status: "unpaid", partial_payment_amount: null, file_path: payload.sourceFilePath || null, original_filename: payload.original_filename || null };
      annex.advance_percent = normalizePercent(annex.advance_percent);
      state.annexes.push(annex);
      setState(state);
      return withComputedPayment(state, annex, "annex");
    },
    async updateAnnex(payload) {
      const state = getState();
      const index = state.annexes.findIndex((annex) => annex.id === Number(payload.id));
      if (index >= 0) {
        state.annexes[index] = {
          ...state.annexes[index],
          number: payload.number !== undefined ? String(payload.number ?? "").trim() : state.annexes[index].number,
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          advance_percent: payload.advance_percent !== undefined ? normalizePercent(payload.advance_percent) : state.annexes[index].advance_percent,
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.annexes[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.annexes[index].original_filename,
        };
      }
      setState(state);
      return index >= 0 ? withComputedPayment(state, state.annexes[index], "annex") : null;
    },
    async deleteAnnex(id) {
      const state = getState();
      const annexId = Number(id);
      state.annexes = state.annexes.filter((annex) => annex.id !== annexId);
      state.secondary_documents = state.secondary_documents.filter((doc) => doc.parent_type !== "annex" || doc.parent_id !== annexId);
      setState(state);
      return { ok: true };
    },
    async createSecondaryDocument(payload) {
      const state = getState();
      const document = {
        id: nextId(state),
        ...payload,
        number: payload.number || "",
        partial_payment_amount: paymentPartialAmount(payload),
        file_path: payload.sourceFilePath || null,
        original_filename: payload.original_filename || "demo-document.pdf",
        created_at: now(),
      };
      state.secondary_documents.push(document);
      setState(state);
      return document;
    },
    async updateSecondaryDocument(payload) {
      const state = getState();
      const index = state.secondary_documents.findIndex((doc) => doc.id === Number(payload.id));
      if (index >= 0) {
        state.secondary_documents[index] = {
          ...state.secondary_documents[index],
          doc_type: payload.doc_type,
          number: payload.number || "",
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          payment_status: payload.payment_status,
          partial_payment_amount: paymentPartialAmount(payload),
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.secondary_documents[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.secondary_documents[index].original_filename,
        };
      }
      setState(state);
      return state.secondary_documents[index] || null;
    },
    async deleteSecondaryDocument(id) {
      const state = getState();
      state.secondary_documents = state.secondary_documents.filter((doc) => doc.id !== Number(id));
      setState(state);
      return { ok: true };
    },
    async listRegistryDocuments() {
      return listRegistryDocumentsFromState(getState());
    },
    async exportAllData() {
      return { ok: false, message: "ZIP-экспорт доступен в Electron-приложении" };
    },
    async importAllData() {
      return { ok: false, message: "ZIP-импорт доступен в Electron-приложении" };
    },
    async selectFile() {
      return { sourceFilePath: "demo-document.pdf", originalFilename: "demo-document.pdf" };
    },
    async openFile() {
      return { ok: false, message: "Открытие файлов доступно в Electron-приложении" };
    },
  };
}

export const api = window.stroySort || makeMockApi();
