(function LayoutBuilderLibrary() {
  // --- CSS Class Constants ---
  const CSS = {
    rowWrapper: "row-wrapper",
    row: "row",
    column: "column",
    colDragHandle: "col-drag-handle",
    rowDragHandle: "row-drag-handle",
    rowControl: "row-control",
    deleteBtn: "delete-btn",
    colPlusBtn: "col-plus-btn",
    layoutLoadSelect: "layout-load-select",
    layoutNameLabel: "layout-name-label",
    saveLayoutBtn: "save-layout-btn",
    selectorOption: "selector-option",
    selectorPreview: "selector-preview",
    selectorCol: "selector-col",
    selectorLabel: "selector-label",
  };

  // --- DOM Helpers Module ---
  const DomHelpers = {
    $: (selector, parent = document) => parent.querySelector(selector),
    $$: (selector, parent = document) =>
      Array.from(parent.querySelectorAll(selector)),
    /**
     * Create a button with optional icon
     * @param {string} text
     * @param {string} className
     * @param {string|null} iconClass
     * @returns {HTMLButtonElement}
     */
    createButton: (text, className, iconClass = null) => {
      const btn = document.createElement("button");
      btn.className = className;
      if (iconClass) {
        const icon = document.createElement("i");
        icon.className = iconClass;
        icon.setAttribute("aria-hidden", "true");
        btn.appendChild(icon);
      }
      if (text) {
        const span = document.createElement("span");
        span.textContent = text;
        btn.appendChild(span);
      }
      return btn;
    },
    /**
     * Create a drag handle for row or column
     * @param {string} type
     * @returns {HTMLDivElement}
     */
    createDragHandle: (type = "row") => {
      const handle = document.createElement("div");
      handle.className = type === "row" ? CSS.rowDragHandle : CSS.colDragHandle;
      handle.title =
        type === "row" ? "Drag to reorder row" : "Drag to reorder column";
      handle.setAttribute("draggable", "true");
      handle.innerHTML =
        type === "row"
          ? `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="9" r="2" fill="#888"/>
            <circle cx="17" cy="9" r="2" fill="#888"/>
            <circle cx="7" cy="18" r="2" fill="#888"/>
            <circle cx="17" cy="18" r="2" fill="#888"/>
            <circle cx="7" cy="27" r="2" fill="#888"/>
            <circle cx="17" cy="27" r="2" fill="#888"/>
          </svg>`
          : `<svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">
            <circle cx="7" cy="8" r="2" fill="#888"/>
            <circle cx="18" cy="8" r="2" fill="#888"/>
            <circle cx="29" cy="8" r="2" fill="#888"/>
            <circle cx="7" cy="18" r="2" fill="#888"/>
            <circle cx="18" cy="18" r="2" fill="#888"/>
            <circle cx="29" cy="18" r="2" fill="#888"/>
          </svg>`;
      return handle;
    },
  };

  // --- AJAX Helpers Module ---
  const AjaxHelpers = {
    /**
     * Fetch JSON with error handling
     * @param {string} url
     * @param {object} [options]
     * @returns {Promise<any>}
     */
    fetchJSON: async (url, options) => {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        alert(`Network or server error: ${err.message}`);
        throw err;
      }
    },
  };
  // --- Centralized App State ---
  const state = {
    currentLayoutName: null,
    hasSavedOnce: false,
    layoutMutationObserver: null,
  };

  // --- DOM Helpers ---
  const $ = DomHelpers.$;
  const $$ = DomHelpers.$$;
  const fetchJSON = AjaxHelpers.fetchJSON;

  // --- Reusable DOM Creation Helpers ---
  // ...existing code...

  // --- Reusable Selector Option Helper ---
  const createSelectorOption = (count, isSelected, onClick) => {
    const option = document.createElement("div");
    option.classList.add("selector-option");
    if (isSelected) option.classList.add("selected");
    const preview = document.createElement("div");
    preview.classList.add("selector-preview");
    for (let i = 0; i < count; i++) {
      const col = document.createElement("div");
      col.classList.add("selector-col");
      preview.appendChild(col);
    }
    const label = document.createElement("div");
    label.classList.add("selector-label");
    label.textContent = `${count} column${count > 1 ? "s" : ""}`;
    option.appendChild(preview);
    option.appendChild(label);
    option.addEventListener("click", onClick);
    return option;
  };

  // --- Reusable Drag-and-Drop Event Attachment ---
  const attachRowDragEvents = (rowDragHandle, wrapper) => {
    rowDragHandle.addEventListener("dragstart", (e) => {
      wrapper.classList.add("dragging-row");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "row");
      window._draggedRow = wrapper;
    });
    rowDragHandle.addEventListener("dragend", () => {
      wrapper.classList.remove("dragging-row");
      window._draggedRow = null;
      document
        .querySelectorAll(".row-wrapper")
        .forEach((w) => w.classList.remove("row-drop-target"));
    });
  };

  const attachColDragEvents = (colDragHandle, col, row, wrapper) => {
    colDragHandle.addEventListener("dragstart", (e) => {
      col.classList.add("dragging-col");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "col");
      row._draggedCol = col;
      document.querySelectorAll(".row-wrapper").forEach((rw) => {
        if (rw !== wrapper) {
          rw.querySelectorAll(".col-drag-handle").forEach((h) =>
            h.classList.add("drag-not-allowed")
          );
          rw.querySelectorAll(".column").forEach((c) =>
            c.classList.add("col-not-allowed")
          );
        }
      });
    });
    colDragHandle.addEventListener("dragend", () => {
      col.classList.remove("dragging-col");
      row._draggedCol = null;
      row
        .querySelectorAll(".column")
        .forEach((c) => c.classList.remove("col-drop-target"));
      document
        .querySelectorAll(".col-drag-handle.drag-not-allowed")
        .forEach((h) => h.classList.remove("drag-not-allowed"));
      document
        .querySelectorAll(".column.col-not-allowed")
        .forEach((c) => c.classList.remove("col-not-allowed"));
    });
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (row._draggedCol && row._draggedCol !== col) {
        col.classList.add("col-drop-target");
        const rect = col.getBoundingClientRect();
        const mouseX = e.clientX;
        const colCenter = rect.left + rect.width / 2;
        if (mouseX > colCenter) {
          if (row._draggedCol !== col.nextSibling) {
            row.insertBefore(row._draggedCol, col.nextSibling);
          }
        } else {
          if (row._draggedCol !== col) {
            row.insertBefore(row._draggedCol, col);
          }
        }
      }
    });
    col.addEventListener("dragleave", () => {
      col.classList.remove("col-drop-target");
    });
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("col-drop-target");
      if (row._draggedCol && row._draggedCol !== col) {
        if (!col.nextSibling) {
          row.insertBefore(row._draggedCol, null);
        } else {
          row.insertBefore(row._draggedCol, col);
        }
      }
    });
  };

  // --- Layout Serialization/Deserialization Utilities ---
  const serializeLayout = () =>
    $$(".row-wrapper").map((wrapper) => {
      const row = $(".row", wrapper);
      const cols = row ? $$(".column", row).length : 0;
      return { columns: cols };
    });

  const deserializeLayout = (layoutArr) => {
    document.querySelectorAll(".row-wrapper").forEach((w) => w.remove());
    layoutArr.forEach((rowObj) => {
      const wrapper = createRow();
      rowsWrapper.appendChild(wrapper);
      setTimeout(() => {
        initRowControls(wrapper);
        if (rowObj.columns > 0) {
          let row = wrapper.querySelector(".row");
          if (row && typeof row.setColumns === "function") {
            row.setColumns(rowObj.columns);
          } else if (typeof wrapper.setColumns === "function") {
            wrapper.setColumns(rowObj.columns);
          } else {
            const selectorOptions =
              wrapper.querySelectorAll(".selector-option");
            if (selectorOptions && selectorOptions.length) {
              const idx = [1, 2, 3, 4].indexOf(rowObj.columns);
              if (idx >= 0 && selectorOptions[idx])
                selectorOptions[idx].click();
            }
          }
        }
      }, 0);
    });
    setTimeout(() => {
      updateRowControls();
      patchRowAutosave();
      enableLayoutAutosaveObserver();
    }, 100);
  };

  // --- Modularized Row Control Initialization ---
  const initRowControlButtons = (rowWrapper, layoutContainer) => {
    rowWrapper.querySelectorAll(".row-control").forEach((el) => el.remove());
    const addAbove = DomHelpers.createButton(
      "Add Row Above",
      "btn",
      "fa fa-plus"
    );
    addAbove.addEventListener("click", () => {
      const newRow = createRow();
      newRow.classList.add("row-animate-in");
      rowsWrapper.insertBefore(newRow, rowWrapper);
      setTimeout(() => {
        newRow.classList.remove("row-animate-in");
        initRowControls(newRow);
        updateRowControls();
      }, 400);
    });
    const controlAbove = document.createElement("div");
    controlAbove.classList.add("row-control", "top");
    controlAbove.appendChild(addAbove);
    rowWrapper.appendChild(controlAbove);
    const addBelow = DomHelpers.createButton(
      "Add Row Below",
      "btn",
      "fa fa-plus"
    );
    addBelow.addEventListener("click", () => {
      const newRow = createRow();
      newRow.classList.add("row-animate-in");
      if (rowWrapper.nextSibling) {
        rowsWrapper.insertBefore(newRow, rowWrapper.nextSibling);
      } else {
        rowsWrapper.appendChild(newRow);
      }
      setTimeout(() => {
        newRow.classList.remove("row-animate-in");
        initRowControls(newRow);
        updateRowControls();
      }, 400);
    });
    const controlBelow = document.createElement("div");
    controlBelow.classList.add("row-control", "bottom");
    controlBelow.appendChild(addBelow);
    rowWrapper.appendChild(controlBelow);
  };

  // --- UI Controls ---
  const layoutContainer = $("#layoutContainer");
  // Add a wrapper for all rows
  const rowsWrapper = document.createElement("div");
  rowsWrapper.className = "rows-wrapper";
  layoutContainer.appendChild(rowsWrapper);

  const layoutSelect = document.createElement("select");
  layoutSelect.className = "layout-load-select";
  layoutSelect.innerHTML = '<option value="">Select layout...</option>';
  layoutSelect.style.margin = "16px 0 8px 0";
  const layoutNameLabel = document.createElement("span");
  layoutNameLabel.className = "layout-name-label";
  layoutNameLabel.style.marginLeft = "12px";
  const saveBtn = DomHelpers.createButton("Save Layout", "save-layout-btn");
  saveBtn.style.margin = "0 8px 8px 0";

  // --- Utility: Update layout name label ---
  const updateLayoutNameLabel = () => {
    layoutNameLabel.textContent = state.currentLayoutName
      ? `Current layout: ${state.currentLayoutName}`
      : "";
  };

  // --- Utility: Get current layout as JSON ---
  const getLayoutJson = serializeLayout;

  // --- AJAX: Save layout to server ---
  const saveLayoutToServer = async (name) => {
    const data = JSON.stringify(getLayoutJson());
    const form = new FormData();
    form.append("name", name);
    form.append("data", data);
    const result = await fetchJSON("save_layout.php", {
      method: "POST",
      body: form,
    });
    if (result.success) {
      state.hasSavedOnce = true;
      state.currentLayoutName = name;
      updateLayoutNameLabel();
      await listLayouts();
      addNewLayoutOption();
      hideSaveBtn();
    } else {
      alert("Save failed: " + (result.error || "Unknown error"));
    }
  };

  // --- AJAX: Load layout from server ---
  const loadLayoutFromServer = async (name) => {
    const arr = await fetchJSON(
      "load_layout.php?name=" + encodeURIComponent(name)
    );
    if (Array.isArray(arr)) {
      restoreLayoutFromJson(arr);
      state.currentLayoutName = name;
      state.hasSavedOnce = true;
      updateLayoutNameLabel();
      hideSaveBtn();
    } else {
      alert("Invalid layout data");
    }
  };

  // --- UI: Hide save button ---
  const hideSaveBtn = () => {
    saveBtn.style.display = "none";
  };

  // --- UI: Add '+ New Layout' option ---
  const addNewLayoutOption = () => {
    let newOpt = layoutSelect.querySelector('option[value="__new__"]');
    if (!newOpt) {
      newOpt = document.createElement("option");
      newOpt.value = "__new__";
      newOpt.textContent = "+ New Layout";
      layoutSelect.insertBefore(newOpt, layoutSelect.firstChild);
    }
  };

  // --- UI: Enable robust autosave observer ---
  const enableLayoutAutosaveObserver = () => {
    if (state.layoutMutationObserver) state.layoutMutationObserver.disconnect();
    state.layoutMutationObserver = new MutationObserver(() => {
      if (state.hasSavedOnce && state.currentLayoutName) {
        saveLayoutToServer(state.currentLayoutName);
      }
    });
    state.layoutMutationObserver.observe(layoutContainer, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  };

  // --- UI: Patch setColumns/showColumnSelector for autosave ---
  const patchRowAutosave = () => {
    $$(".row-wrapper").forEach((wrapper) => {
      if (wrapper.setColumns) {
        const origSetColumns = wrapper.setColumns;
        wrapper.setColumns = function (count) {
          origSetColumns.call(this, count);
          autoSaveLayout();
        };
      }
      if (wrapper.showColumnSelector) {
        const origShowColSel = wrapper.showColumnSelector;
        wrapper.showColumnSelector = function () {
          origShowColSel.call(this);
          autoSaveLayout();
        };
      }
    });
  };

  // --- UI: Autosave logic ---
  const autoSaveLayout = () => {
    if (state.hasSavedOnce && state.currentLayoutName) {
      saveLayoutToServer(state.currentLayoutName);
    }
  };

  // --- Layout Save/Load Dropdown and Logic ---
  layoutSelect.addEventListener("change", async function () {
    const name = this.value;
    if (!name || name === "__new__") return;
    await loadLayoutFromServer(name);
  });
  document.body.insertBefore(layoutSelect, layoutContainer);

  // Show current layout name
  document.body.insertBefore(layoutNameLabel, layoutSelect.nextSibling);

  async function listLayouts() {
    const res = await fetch("list_layouts.php");
    const names = await res.json();
    layoutSelect.innerHTML = '<option value="">Select layout...</option>';
    names.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      layoutSelect.appendChild(opt);
    });
    if (state.currentLayoutName) {
      layoutSelect.value = state.currentLayoutName;
    }
    addNewLayoutOption();
  }

  // Add 'New Layout' option to dropdown

  layoutSelect.addEventListener("change", function () {
    if (this.value === "__new__") {
      // Clear everything and show save button again
      document.querySelectorAll(".row-wrapper").forEach((w) => w.remove());
      const newRow = createRow();
      rowsWrapper.appendChild(newRow);
      setTimeout(() => {
        initRowControls(newRow);
        if (newRow.updateDeleteBtnVisibility)
          newRow.updateDeleteBtnVisibility();
      }, 100);
      state.currentLayoutName = null;
      state.hasSavedOnce = false;
      updateLayoutNameLabel();
      saveBtn.style.display = "inline-block";
      this.value = "";
    }
  });

  // Save button (only for first save)
  saveBtn.onclick = async function () {
    const name = prompt("Enter layout name:");
    if (!name) return;
    await saveLayoutToServer(name);
  };
  document.body.insertBefore(saveBtn, layoutSelect);

  // --- Restore layout from JSON array ---
  function restoreLayoutFromJson(layoutArr) {
    deserializeLayout(layoutArr);
  }

  // --- Column options ---
  const columnOptions = [1, 2, 3, 4];

  // --- Helper to animate row removal ---
  function animateRowRemove(rowElem, callback) {
    rowElem.classList.add("row-animate-out");
    rowElem.addEventListener("animationend", function handler() {
      rowElem.removeEventListener("animationend", handler);
      if (typeof callback === "function") callback();
    });
  }

  // --- Helper to initialize controls for a single row ---
  function initRowControls(rowWrapper) {
    initRowControlButtons(rowWrapper, layoutContainer);
  }

  // --- Create Row ---
  function createRow() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("row-wrapper");
    // --- Not-allowed feedback for column drag over other rows ---
    wrapper.addEventListener("dragenter", (e) => {
      if (
        typeof row !== "undefined" &&
        row._draggedCol &&
        window._draggedRow == null
      ) {
        const draggedCol = row._draggedCol;
        const draggedColRowWrapper = draggedCol
          ? draggedCol.closest(".row-wrapper")
          : null;
        if (wrapper !== draggedColRowWrapper) {
          wrapper.classList.add("row-not-allowed");
        }
      }
    });
    wrapper.addEventListener("dragleave", (e) => {
      wrapper.classList.remove("row-not-allowed");
    });
    wrapper.addEventListener("drop", (e) => {
      wrapper.classList.remove("row-not-allowed");
    });

    // Drag and drop for rows
    let rowDragHandle = DomHelpers.createDragHandle("row");
    attachRowDragEvents(rowDragHandle, wrapper);

    wrapper.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (window._draggedRow && window._draggedRow !== wrapper) {
        wrapper.classList.add("row-drop-target");
        const rect = wrapper.getBoundingClientRect();
        const mouseY = e.clientY;
        const rowCenter = rect.top + rect.height / 2;
        const parent = wrapper.parentNode;
        if (mouseY > rowCenter) {
          if (window._draggedRow !== wrapper.nextSibling) {
            parent.insertBefore(window._draggedRow, wrapper.nextSibling);
          }
        } else {
          if (window._draggedRow !== wrapper) {
            parent.insertBefore(window._draggedRow, wrapper);
          }
        }
      }
    });
    wrapper.addEventListener("dragleave", () => {
      wrapper.classList.remove("row-drop-target");
    });
    wrapper.addEventListener("drop", (e) => {
      e.preventDefault();
      wrapper.classList.remove("row-drop-target");
      if (window._draggedRow && window._draggedRow !== wrapper) {
        const parent = wrapper.parentNode;
        if (!wrapper.nextSibling) {
          parent.appendChild(window._draggedRow);
        } else {
          parent.insertBefore(window._draggedRow, wrapper);
        }
        updateRowControls();
      }
    });

    const row = document.createElement("div");
    row.classList.add("row");

    // Always append deleteBtn to the row, before or after column selection
    function showColumnSelector() {
      row.innerHTML = "";
      row.appendChild(rowDragHandle); // Always append drag handle
      row.appendChild(deleteBtn);
      updateDeleteBtnVisibility();
      let currentColCount = wrapper._currentColCount || 0;
      const selector = document.createElement("div");
      selector.classList.add("column-selector");
      columnOptions.forEach((count) => {
        selector.appendChild(
          createSelectorOption(count, count === currentColCount, () =>
            setColumns(count)
          )
        );
      });
      row.appendChild(selector);
      updateRowControls();
    }

    function setColumns(count) {
      row.innerHTML = "";
      wrapper._currentColCount = count;
      row.appendChild(rowDragHandle); // Always append drag handle
      row.appendChild(deleteBtn);
      updateDeleteBtnVisibility();
      const columns = [];
      for (let i = 0; i < count; i++) {
        const col = document.createElement("div");
        col.classList.add("column", `col-${count}`);
        const plusBtn = DomHelpers.createButton("", "col-plus-btn");
        plusBtn.innerHTML = "<span>+</span>";
        plusBtn.type = "button";
        plusBtn.tabIndex = -1;
        plusBtn.style.pointerEvents = "none";
        col.appendChild(plusBtn);
        if (count > 1) {
          const colDragHandle = DomHelpers.createDragHandle("col");
          attachColDragEvents(colDragHandle, col, row, wrapper);
          col.appendChild(colDragHandle);
        }
        columns.push(col);
      }
      columns.forEach((col) => row.appendChild(col));
      const changeBtn = document.createElement("button");
      changeBtn.className = "change-layout-btn";
      const changeIcon = document.createElement("i");
      changeIcon.className = "fa fa-random";
      changeIcon.setAttribute("aria-hidden", "true");
      changeBtn.appendChild(changeIcon);
      const changeText = document.createElement("span");
      changeText.textContent = "Change layout";
      changeBtn.appendChild(changeText);
      changeBtn.addEventListener("mouseenter", () => {
        changeBtn.classList.add("change-layout-btn-hover");
      });
      changeBtn.addEventListener("mouseleave", () => {
        changeBtn.classList.remove("change-layout-btn-hover");
      });
      changeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showColumnSelector();
      });
      row.appendChild(changeBtn);
      updateRowControls();
    }

    // Create the delete button and handler only once per row
    const deleteBtn = DomHelpers.createButton(
      "Delete Row",
      "delete-btn",
      "fa fa-trash"
    );
    deleteBtn.onclick = function () {
      if (document.querySelectorAll(".row-wrapper").length > 1) {
        animateRowRemove(wrapper, () => {
          wrapper.remove();
          updateRowControls();
        });
      }
    };

    function updateDeleteBtnVisibility() {
      if (document.querySelectorAll(".row-wrapper").length === 1) {
        deleteBtn.classList.add("delete-btn-hidden");
      } else {
        deleteBtn.classList.remove("delete-btn-hidden");
      }
    }
    wrapper.updateDeleteBtnVisibility = updateDeleteBtnVisibility;

    showColumnSelector();
    wrapper.appendChild(row);

    // Patch for autosave
    wrapper.setColumns = setColumns;
    wrapper.showColumnSelector = showColumnSelector;

    return wrapper;
  }

  // --- Update row controls for all rows ---
  function updateRowControls() {
    document.querySelectorAll(".row-control").forEach((el) => el.remove());
    const rows = rowsWrapper.querySelectorAll(".row-wrapper");
    const showDrag = rows.length > 1;
    rows.forEach((rowWrapper) => {
      // Always ensure drag handle is present and toggle its visibility
      const rowDiv = rowWrapper.querySelector(".row");
      const dragHandle = rowDiv && rowDiv.querySelector(".row-drag-handle");
      if (dragHandle) dragHandle.style.display = showDrag ? "" : "none";
      initRowControls(rowWrapper);
    });
    rows.forEach((rowWrapper) => {
      if (rowWrapper.updateDeleteBtnVisibility)
        rowWrapper.updateDeleteBtnVisibility();
    });
  }

  // --- On load, always create a row (no addRowBtn) ---
  const initialRow = createRow();
  rowsWrapper.appendChild(initialRow);
  setTimeout(() => {
    initRowControls(initialRow);
    if (initialRow.updateDeleteBtnVisibility)
      initialRow.updateDeleteBtnVisibility();
  }, 100);

  // Patch setColumns and showColumnSelector to call autoSave
  const origCreateRow = createRow;
  createRow = function (...args) {
    const wrapper = origCreateRow.apply(this, args);
    if (wrapper.setColumns) {
      const origSetColumns = wrapper.setColumns;
      wrapper.setColumns = function (count) {
        origSetColumns.call(this, count);
        autoSaveLayout();
      };
    }
    if (wrapper.showColumnSelector) {
      const origShowColSel = wrapper.showColumnSelector;
      wrapper.showColumnSelector = function () {
        origShowColSel.call(this);
        autoSaveLayout();
      };
    }
    return wrapper;
  };

  // Ensure layout dropdown loads on page load
  listLayouts();
  // Optionally expose a global for future extensibility
  window.LayoutBuilder = {
    init: function () {},
  };
})();
