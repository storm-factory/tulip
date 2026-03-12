# Tulip Modernization Refactor Plan

## Principles
- claude output should be succint and devoid of emojis
- code should follow SOLID principles
- all solutions should be as simple as possible
- human readability should be favored

## Executive Summary

This document outlines the Tulip roadbook application, a desktop Electron app for creating rally navigation documents. The app is currently built on Electron with jQuery, Knockout.js, and Foundation CSS.


```
Application (Global singleton)
 └─ Modules:
     └─ Mapping
         └─ Roadbook
             └─ Waypoint
                 └─ Tulip
                     └─ TrackEditor
```



---

## Recommended Approach: Service-Oriented Architecture

### Why This Pattern?

✅ **Electron-friendly**: Services handle platform APIs cleanly
✅ **Testable**: Each layer can be tested independently
✅ **Maintainable**: Clear separation of concerns
✅ **Scalable**: Easy to add new features
✅ **Migration-friendly**: Can refactor incrementally
✅ **Framework-agnostic**: Works with vanilla JS now, React later if needed

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Application                          │
│              (Bootstrap & Coordination)                 │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SERVICES   │  │    DOMAIN    │  │      UI      │
│              │  │    MODELS    │  │  CONTROLLERS │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
┌───────┴────────┐  ┌──────┴──────┐  ┌───────┴────────┐
│ FileService    │  │ Roadbook    │  │ MapController  │
│ DialogService  │  │ Waypoint    │  │ UIController   │
│ ExportService  │  │ Tulip       │  │ PaletteCtrl    │
│ MapService     │  │ Track       │  │                │
│ IPCService     │  │ Glyph       │  │                │
└────────────────┘  └─────────────┘  └────────────────┘
```

---


## Modernization Strategy

### ⚠️ Revised Phase Order

**Original Order**: Phases 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

**Revised Order** (Practical Implementation):
- ✅ **Phase 1**: Electron Upgrade - *COMPLETED*
- ✅ **Phase 2**: Extract Services - *COMPLETED*
- ✅ **Phase 4**: Create Controllers - *COMPLETED*
- ✅ **Phase 5**: Add EventBus - *COMPLETED*
- ✅ **Phase 6**: Remove jQuery/Knockout - *COMPLETED (mostly - jQuery retained for Foundation)*
- ✅ **Phase 3**: Refine Domain Models - *COMPLETED (kept Knockout for templates)*
- **Phase 7**: Modernize CSS *(Skipped for now)*
- **Phase 8**: Add Build Tooling *(Skipped for now)*
- ✅ **Phase 9**: Settings UI - *COMPLETED*
- ✅ **Phase 10**: Help UI - *COMPLETED*

**Why the change?**
After analyzing the codebase, Phase 3 (Refine Domain Models) is heavily dependent on Phase 6 (Remove jQuery/Knockout) because the current models are tightly coupled with Knockout.js observables and jQuery DOM manipulation. Attempting to refactor models while keeping Knockout would require rewriting everything twice. It's more pragmatic to:
1. Build the controller layer (Phase 4)
2. Add EventBus for decoupling (Phase 5)
3. Remove jQuery/Knockout together (Phase 6)
4. Then refactor models to be pure (Phase 3)

This revised order is **more incremental** and **avoids duplicate work**.

---

## References

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Vanilla JS vs jQuery Performance](https://youmightnotneedjquery.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Service-Oriented Architecture](https://en.wikipedia.org/wiki/Service-oriented_architecture)

---

## Document History

- **2025-03-05**: Initial version created
- **Author**: Development team
- **Status**: Proposed
