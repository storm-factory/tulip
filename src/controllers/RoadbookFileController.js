/*
  ============================================================================
  Roadbook File Controller
  ============================================================================

  RESPONSIBILITIES:
  - Handle all roadbook file operations (open, save, save as)
  - Handle all import/export operations (GPX, PDF, Lexicon)
  - Coordinate between FileService, ExportService, and Roadbook model
  - Show loading states during file operations
  - No direct DOM manipulation except loading indicator

  DEPENDENCIES:
  - FileService (Phase 2)
  - ExportService (Phase 2)
  - DialogService (Phase 2)
  - Roadbook model
  - Io module (legacy)
  - EventBus (Phase 5)

  Refactored from application.js to reduce file size and improve separation of concerns
*/

class RoadbookFileController {
  constructor(roadbook, fileService, exportService, dialogService, roadbookController, eventBus) {
    this.roadbook = roadbook;
    this.fileService = fileService;
    this.exportService = exportService;
    this.dialogService = dialogService;
    this.roadbookController = roadbookController;
    this.eventBus = eventBus;
  }

  /**
   * Check if roadbook can be exported (has waypoints and is saved)
   * @returns {boolean}
   */
  canExport() {
    return this.roadbook.waypoints().length > 0 && this.roadbook.filePath != null;
  }

  /**
   * Check if roadbook can be saved (has waypoints)
   * @returns {boolean}
   */
  canSave() {
    return this.roadbook.waypoints().length > 0;
  }

  /**
   * Open a roadbook file
   */
  openRoadBook() {
    // RoadbookController handles loading state after file is selected
    this.roadbookController.openRoadbook();
  }

  /**
   * Export roadbook as GPX
   */
  exportGPX() {
    if (!this.canExport()) {
      this.dialogService.showError('Please save roadbook before exporting');
      return;
    }
    // RoadbookController handles the export
    this.roadbookController.exportGPX();
  }

  /**
   * Export roadbook as OpenRally GPX
   */
  exportOpenRallyGPX() {
    if (!this.canExport()) {
      this.dialogService.showError('Please save roadbook before exporting');
      return;
    }
    // RoadbookController handles the export
    this.roadbookController.exportOpenRallyGPX();
  }

  /**
   * Import GPX file
   */
  importGPX() {
    // RoadbookController handles loading state after file is selected
    this.roadbookController.importGPX();
  }

  /**
   * Print/export roadbook as PDF
   */
  printRoadbook() {
    this.roadbookController.printRoadbook();
  }

  /**
   * Print/export lexicon key
   */
  printLexicon() {
    this.roadbookController.printLexicon();
  }

  /**
   * Save roadbook to current file
   */
  saveRoadBook() {
    if (!this.canSave()) return;
    this.roadbookController.saveRoadbook();
  }

  /**
   * Save roadbook to new file (Save As)
   */
  saveRoadBookAs() {
    if (!this.canSave()) return;
    this.roadbookController.saveRoadbookAs();
  }

  /**
   * Show save dialog for roadbook
   * @param {string} title - Dialog title
   * @param {string} path - Default file path
   */
  showSaveDialog(title, path) {
    this.roadbookController.showSaveDialog(title, path);
  }

  /**
   * Show loading indicator
   */
  startLoading() {
    const loading = document.querySelector('#loading');
    if (loading) {
      loading.style.display = 'block';
      loading.style.opacity = '1';
    }
  }

  /**
   * Hide loading indicator
   */
  stopLoading() {
    const loading = document.querySelector('#loading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => {
        loading.style.display = 'none';
      }, 300);
    }
  }
}
