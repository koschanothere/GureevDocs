const { contextBridge, ipcRenderer, webUtils } = require("electron");

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld("stroySort", {
  listObjects: () => invoke("objects:list"),
  getObjectDetails: (id) => invoke("objects:get", { id }),
  createObject: (payload) => invoke("objects:create", payload),
  updateObject: (payload) => invoke("objects:update", payload),
  deleteObject: (id) => invoke("objects:delete", { id }),

  createCommercialProposal: (payload) => invoke("proposals:create", payload),
  updateCommercialProposal: (payload) => invoke("proposals:update", payload),
  deleteCommercialProposal: (id) => invoke("proposals:delete", { id }),
  createContractFromProposal: (payload) => invoke("proposals:contract", payload),

  createContract: (payload) => invoke("contracts:create", payload),
  updateContract: (payload) => invoke("contracts:update", payload),
  deleteContract: (id) => invoke("contracts:delete", { id }),

  createAnnex: (payload) => invoke("annexes:create", payload),
  updateAnnex: (payload) => invoke("annexes:update", payload),
  deleteAnnex: (id) => invoke("annexes:delete", { id }),

  createSecondaryDocument: (payload) => invoke("secondary:create", payload),
  updateSecondaryDocument: (payload) => invoke("secondary:update", payload),
  deleteSecondaryDocument: (id) => invoke("secondary:delete", { id }),

  listRegistryDocuments: () => invoke("registry:list"),
  exportAllData: () => invoke("backup:export"),
  importAllData: () => invoke("backup:import"),
  selectFile: () => invoke("files:select"),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  openFile: (filePath) => invoke("files:open", { filePath }),
});
