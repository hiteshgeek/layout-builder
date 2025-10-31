const layoutContainer = document.getElementById("layoutContainer");
// --- Layout Save/Load Dropdown and Logic ---
let currentLayoutName = null;
let hasSavedOnce = false;

// Create dropdown for layout selection
const layoutSelect = document.createElement("select");
layoutSelect.className = "layout-load-select";
layoutSelect.innerHTML = '<option value="">Select layout...</option>';
layoutSelect.style.margin = "16px 0 8px 0";
layoutSelect.addEventListener("change", async function () {
  const name = this.value;
  if (!name || name === "__new__") return;
  await loadLayoutFromServer(name);
});
document.body.insertBefore(layoutSelect, layoutContainer);

// Show current layout name
const layoutNameLabel = document.createElement("span");
layoutNameLabel.className = "layout-name-label";
layoutNameLabel.style.marginLeft = "12px";
document.body.insertBefore(layoutNameLabel, layoutSelect.nextSibling);

function updateLayoutNameLabel() {
  layoutNameLabel.textContent = currentLayoutName
    ? `Current layout: ${currentLayoutName}`
    : "";
}

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
  if (currentLayoutName) {
    layoutSelect.value = currentLayoutName;
  }
  addNewLayoutOption();
}

// Hide save button after first save or load
function hideSaveBtn() {
  saveBtn.style.display = "none";
}

// Add 'New Layout' option to dropdown
function addNewLayoutOption() {
  let newOpt = layoutSelect.querySelector('option[value="__new__"]');
  if (!newOpt) {
    newOpt = document.createElement("option");
    newOpt.value = "__new__";
    newOpt.textContent = "+ New Layout";
    layoutSelect.insertBefore(newOpt, layoutSelect.firstChild);
  }
}

layoutSelect.addEventListener("change", function () {
  if (this.value === "__new__") {
    // Clear everything and show save button again
    document.querySelectorAll(".row-wrapper").forEach((w) => w.remove());
    const newRow = createRow();
    layoutContainer.appendChild(newRow);
    setTimeout(() => {
      initRowControls(newRow);
      if (newRow.updateDeleteBtnVisibility) newRow.updateDeleteBtnVisibility();
    }, 100);
    currentLayoutName = null;
    hasSavedOnce = false;
    updateLayoutNameLabel();
    saveBtn.style.display = "inline-block";
    this.value = "";
  }
});

function getLayoutJson() {
  return Array.from(document.querySelectorAll(".row-wrapper")).map(
    (wrapper) => {
      const row = wrapper.querySelector(".row");
      const cols = row ? row.querySelectorAll(".column").length : 0;
      return { columns: cols };
    }
  );
}

async function saveLayoutToServer(name) {
  const data = JSON.stringify(getLayoutJson());
  const form = new FormData();
  form.append("name", name);
  form.append("data", data);
  const res = await fetch("save_layout.php", { method: "POST", body: form });
  const result = await res.json();
  if (result.success) {
    hasSavedOnce = true;
    currentLayoutName = name;
    updateLayoutNameLabel();
    await listLayouts();
    addNewLayoutOption();
    hideSaveBtn();
  } else {
    alert("Save failed: " + (result.error || "Unknown error"));
  }
}

async function loadLayoutFromServer(name) {
  const res = await fetch("load_layout.php?name=" + encodeURIComponent(name));
  try {
    const arr = await res.json();
    if (Array.isArray(arr)) {
      restoreLayoutFromJson(arr);
      currentLayoutName = name;
      hasSavedOnce = true;
      updateLayoutNameLabel();
      hideSaveBtn();
    } else {
      alert("Invalid layout data");
    }
  } catch (e) {
    alert("Load failed");
  }
}

// Save button (only for first save)
const saveBtn = document.createElement("button");
saveBtn.textContent = "Save Layout";
saveBtn.style.margin = "0 8px 8px 0";
saveBtn.onclick = async function () {
  const name = prompt("Enter layout name:");
  if (!name) return;
  await saveLayoutToServer(name);
};
document.body.insertBefore(saveBtn, layoutSelect);

// Auto-save after first save
function autoSaveLayout() {
  if (hasSavedOnce && currentLayoutName) {
    saveLayoutToServer(currentLayoutName);
  }
}

// --- Robust autosave observer ---
let layoutMutationObserver = null;
function enableLayoutAutosaveObserver() {
  if (layoutMutationObserver) layoutMutationObserver.disconnect();
  layoutMutationObserver = new MutationObserver(() => {
    if (hasSavedOnce && currentLayoutName) {
      saveLayoutToServer(currentLayoutName);
    }
  });
  layoutMutationObserver.observe(layoutContainer, {
    childList: true,
    subtree: true,
    attributes: false,
  });
}

// Restore layout from JSON array
function restoreLayoutFromJson(layoutArr) {
  document.querySelectorAll(".row-wrapper").forEach((w) => w.remove());
  layoutArr.forEach((rowObj) => {
    const wrapper = createRow();
    layoutContainer.appendChild(wrapper);
    setTimeout(() => {
      initRowControls(wrapper);
      // Always set columns using the same logic as column selector
      if (rowObj.columns > 0) {
        // Try to find the setColumns function from the row context
        let row = wrapper.querySelector(".row");
        if (row && typeof row.setColumns === "function") {
          row.setColumns(rowObj.columns);
        } else if (typeof wrapper.setColumns === "function") {
          wrapper.setColumns(rowObj.columns);
        } else {
          // fallback: simulate click on the correct selector option
          const selectorOptions = wrapper.querySelectorAll(".selector-option");
          if (selectorOptions && selectorOptions.length) {
            const idx = [1, 2, 3, 4].indexOf(rowObj.columns);
            if (idx >= 0 && selectorOptions[idx]) selectorOptions[idx].click();
          }
        }
      }
    }, 0);
  });
  setTimeout(() => {
    updateRowControls();
    patchRowAutosave(); // Enable autosave for all rows
    enableLayoutAutosaveObserver(); // Robust autosave for all changes
  }, 100);
}

// On page load, list layouts
listLayouts().then(addNewLayoutOption);
const columnOptions = [1, 2, 3, 4];

function createRowControl(position = "top") {
  const control = document.createElement("div");
  control.classList.add("row-control", position);
  const btn = document.createElement("div");
  btn.className = "btn";
  // Font Awesome icon for add
  const icon = document.createElement("i");
  icon.className = "fa fa-plus";
  icon.setAttribute("aria-hidden", "true");
  btn.appendChild(icon);
  const text = document.createElement("span");
  text.textContent = position === "top" ? "Add Row Above" : "Add Row Below";
  btn.appendChild(text);
  control.appendChild(btn);
  return control;
}

// Helper to animate row removal
function animateRowRemove(rowElem, callback) {
  rowElem.classList.add("row-animate-out");
  rowElem.addEventListener("animationend", function handler() {
    rowElem.removeEventListener("animationend", handler);
    if (typeof callback === "function") callback();
  });
}

// Helper to initialize controls for a single row
function initRowControls(rowWrapper) {
  // Remove any existing controls for this row
  rowWrapper.querySelectorAll(".row-control").forEach((el) => el.remove());
  // Add an ABOVE button
  const addAbove = createRowControl("top");
  addAbove.addEventListener("click", () => {
    const newRow = createRow();
    newRow.classList.add("row-animate-in");
    layoutContainer.insertBefore(newRow, rowWrapper);
    setTimeout(() => {
      newRow.classList.remove("row-animate-in");
      initRowControls(newRow);
      updateRowControls(); // Ensure delete buttons are updated
    }, 400);
  });
  rowWrapper.appendChild(addAbove);
  // Add a BELOW button
  const addBelow = createRowControl("bottom");
  addBelow.addEventListener("click", () => {
    const newRow = createRow();
    newRow.classList.add("row-animate-in");
    if (rowWrapper.nextSibling) {
      layoutContainer.insertBefore(newRow, rowWrapper.nextSibling);
    } else {
      layoutContainer.appendChild(newRow);
    }
    setTimeout(() => {
      newRow.classList.remove("row-animate-in");
      initRowControls(newRow);
      updateRowControls(); // Ensure delete buttons are updated
    }, 400);
  });
  rowWrapper.appendChild(addBelow);
}

function createRow() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("row-wrapper");
  // --- Not-allowed feedback for column drag over other rows ---
  wrapper.addEventListener("dragenter", (e) => {
    // Determine row number (1-based index among all .row-wrapper elements)
    const allRowWrappers = Array.from(
      document.querySelectorAll(".row-wrapper")
    );
    const rowNumber = allRowWrappers.indexOf(wrapper) + 1;
    // console.log("[DEBUG] dragenter .row-wrapper", {
    //   rowNumber,
    //   rowDefined: typeof row !== "undefined",
    //   rowObj: row,
    //   row_draggedCol: row && row._draggedCol,
    //   window_draggedRow: window._draggedRow,
    // });
    if (
      typeof row !== "undefined" &&
      row._draggedCol &&
      window._draggedRow == null
    ) {
      // Only if a column is being dragged and not a row
      const draggedCol = row._draggedCol;
      const draggedColRowWrapper = draggedCol
        ? draggedCol.closest(".row-wrapper")
        : null;
      const eventRowWrapper = e.target.closest(".row-wrapper");
      if (wrapper !== draggedColRowWrapper) {
        // console.log(
        //   "[DEBUG] Not-allowed feedback: dragging column to another row",
        //   { wrapper, draggedColRowWrapper, eventRowWrapper }
        // );
        wrapper.classList.add("row-not-allowed");
      } else {
        // console.log("[DEBUG] Dragging column inside its own row", {
        //   wrapper,
        //   draggedColRowWrapper,
        //   eventRowWrapper,
        // });
      }
    }
  });
  wrapper.addEventListener("dragleave", (e) => {
    wrapper.classList.remove("row-not-allowed");
  });
  wrapper.addEventListener("drop", (e) => {
    wrapper.classList.remove("row-not-allowed");
  });

  // Drag and drop for rows (handle visibility managed by updateRowControls)
  let rowDragHandle = null;
  function createRowDragHandle() {
    const handle = document.createElement("div");
    handle.className = "row-drag-handle";
    handle.title = "Drag to reorder row";
    handle.setAttribute("draggable", "true");
    handle.innerHTML = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="9" r="2" fill="#888"/>
      <circle cx="17" cy="9" r="2" fill="#888"/>
      <circle cx="7" cy="18" r="2" fill="#888"/>
      <circle cx="17" cy="18" r="2" fill="#888"/>
      <circle cx="7" cy="27" r="2" fill="#888"/>
      <circle cx="17" cy="27" r="2" fill="#888"/>
    </svg>`;
    handle.addEventListener("dragstart", (e) => {
      wrapper.classList.add("dragging-row");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "row");
      window._draggedRow = wrapper;
    });
    handle.addEventListener("dragend", () => {
      wrapper.classList.remove("dragging-row");
      window._draggedRow = null;
      document
        .querySelectorAll(".row-wrapper")
        .forEach((w) => w.classList.remove("row-drop-target"));
    });
    return handle;
  }
  rowDragHandle = createRowDragHandle();
  wrapper.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (window._draggedRow && window._draggedRow !== wrapper) {
      wrapper.classList.add("row-drop-target");
      // Live reordering: move the dragged row before or after hovered row
      const rect = wrapper.getBoundingClientRect();
      const mouseY = e.clientY;
      const rowCenter = rect.top + rect.height / 2;
      const parent = wrapper.parentNode;
      if (mouseY > rowCenter) {
        // Dragging down: move after hovered row
        if (window._draggedRow !== wrapper.nextSibling) {
          parent.insertBefore(window._draggedRow, wrapper.nextSibling);
        }
      } else {
        // Dragging up: move before hovered row
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
      // If dropping on the last row and dragging downward, append to end
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
  // In showColumnSelector and setColumns, always append deleteBtn
  function showColumnSelector() {
    row.innerHTML = "";
    if (layoutContainer.querySelectorAll(".row-wrapper").length > 1) {
      row.appendChild(rowDragHandle);
    }
    row.appendChild(deleteBtn); // Always re-append after clearing
    updateDeleteBtnVisibility();
    // Use wrapper._currentColCount to determine selected layout
    let currentColCount = wrapper._currentColCount || 0;
    const selector = document.createElement("div");
    selector.classList.add("column-selector");
    columnOptions.forEach((count) => {
      const option = document.createElement("div");
      option.classList.add("selector-option");
      if (count === currentColCount) {
        option.classList.add("selected");
      }
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
      option.addEventListener("click", () => {
        setColumns(count);
      });
      selector.appendChild(option);
    });
    row.appendChild(selector);
  }

  function setColumns(count) {
    row.innerHTML = "";
    // Store the current column count on the wrapper for selector highlighting
    wrapper._currentColCount = count;
    if (layoutContainer.querySelectorAll(".row-wrapper").length > 1) {
      row.appendChild(rowDragHandle);
    }
    row.appendChild(deleteBtn); // Always re-append after clearing
    updateDeleteBtnVisibility();
    const columns = [];
    for (let i = 0; i < count; i++) {
      const col = document.createElement("div");
      col.classList.add("column", `col-${count}`);
      // Add stylistic plus button instead of numbering
      const plusBtn = document.createElement("button");
      plusBtn.className = "col-plus-btn";
      plusBtn.innerHTML = "<span>+</span>";
      plusBtn.type = "button";
      plusBtn.tabIndex = -1;
      plusBtn.style.pointerEvents = "none"; // purely decorative
      col.appendChild(plusBtn);
      // Add column drag handle only if more than one column
      if (count > 1) {
        const colDragHandle = document.createElement("div");
        colDragHandle.className = "col-drag-handle";
        colDragHandle.title = "Drag to reorder column";
        colDragHandle.setAttribute("draggable", "true");
        colDragHandle.innerHTML = `<svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">
          <circle cx="7" cy="8" r="2" fill="#888"/>
          <circle cx="18" cy="8" r="2" fill="#888"/>
          <circle cx="29" cy="8" r="2" fill="#888"/>
          <circle cx="7" cy="18" r="2" fill="#888"/>
          <circle cx="18" cy="18" r="2" fill="#888"/>
          <circle cx="29" cy="18" r="2" fill="#888"/>
        </svg>`;
        colDragHandle.addEventListener("dragstart", (e) => {
          col.classList.add("dragging-col");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "col");
          row._draggedCol = col;
          // Mark all col-drag-handles and columns in other rows as not-allowed
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
          // Remove not-allowed feedback from all col-drag-handles and columns
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
            // Determine mouse position relative to the hovered column
            const rect = col.getBoundingClientRect();
            const mouseX = e.clientX;
            const colCenter = rect.left + rect.width / 2;
            if (mouseX > colCenter) {
              // Dragging right: move after hovered column
              if (row._draggedCol !== col.nextSibling) {
                row.insertBefore(row._draggedCol, col.nextSibling);
              }
            } else {
              // Dragging left: move before hovered column
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
            // If dropping on the last column, insert after it (at the end)
            if (!col.nextSibling) {
              row.insertBefore(row._draggedCol, null);
            } else {
              row.insertBefore(row._draggedCol, col);
            }
          }
        });
        col.appendChild(colDragHandle);
      }
      columns.push(col);
    }
    columns.forEach((col) => row.appendChild(col));
    // Add change layout button (Font Awesome icon and text)
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
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  const delIcon = document.createElement("i");
  delIcon.className = "fa fa-trash";
  delIcon.setAttribute("aria-hidden", "true");
  deleteBtn.appendChild(delIcon);
  const delText = document.createElement("span");
  delText.textContent = "Delete Row";
  deleteBtn.appendChild(delText);
  deleteBtn.onclick = function () {
    if (document.querySelectorAll(".row-wrapper").length > 1) {
      animateRowRemove(wrapper, () => {
        wrapper.remove();
        updateRowControls();
      });
    }
  };

  // Helper to update delete button visibility
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
  return wrapper;
}

function updateRowControls() {
  document.querySelectorAll(".row-control").forEach((el) => el.remove());
  const rows = layoutContainer.querySelectorAll(".row-wrapper");

  // Remove all existing row drag handles
  rows.forEach((rowWrapper) => {
    const existingHandle = rowWrapper.querySelector(".row-drag-handle");
    if (existingHandle) existingHandle.remove();
  });

  // Add row drag handle to all rows if more than one row exists
  if (rows.length > 1) {
    rows.forEach((rowWrapper) => {
      // Only add if not present
      if (!rowWrapper.querySelector(".row-drag-handle")) {
        const handle = document.createElement("div");
        handle.className = "row-drag-handle";
        handle.title = "Drag to reorder row";
        handle.setAttribute("draggable", "true");
        handle.innerHTML = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="9" r="2" fill="#888"/>
          <circle cx="17" cy="9" r="2" fill="#888"/>
          <circle cx="7" cy="18" r="2" fill="#888"/>
          <circle cx="17" cy="18" r="2" fill="#888"/>
          <circle cx="7" cy="27" r="2" fill="#888"/>
          <circle cx="17" cy="27" r="2" fill="#888"/>
        </svg>`;
        handle.addEventListener("dragstart", (e) => {
          rowWrapper.classList.add("dragging-row");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "row");
          window._draggedRow = rowWrapper;
        });
        handle.addEventListener("dragend", () => {
          rowWrapper.classList.remove("dragging-row");
          window._draggedRow = null;
          document
            .querySelectorAll(".row-wrapper")
            .forEach((w) => w.classList.remove("row-drop-target"));
        });
        // Insert as first child if not present
        rowWrapper.firstChild
          ? rowWrapper.insertBefore(handle, rowWrapper.firstChild)
          : rowWrapper.appendChild(handle);
      }
    });
  }

  rows.forEach((rowWrapper) => {
    initRowControls(rowWrapper);
  });

  // After updating controls, update delete button visibility for all rows
  document.querySelectorAll(".row-wrapper").forEach((rowWrapper) => {
    if (rowWrapper.updateDeleteBtnVisibility)
      rowWrapper.updateDeleteBtnVisibility();
  });
}

// Delete button (Font Awesome icon and text)
const deleteBtn = document.createElement("button");
deleteBtn.classList.add("delete-btn");
const delIcon = document.createElement("i");
delIcon.className = "fa fa-trash";
delIcon.setAttribute("aria-hidden", "true");
deleteBtn.appendChild(delIcon);
const delText = document.createElement("span");
delText.textContent = "Delete Row";
deleteBtn.appendChild(delText);
deleteBtn.addEventListener("click", () => {
  // Only allow delete if more than one row exists
  if (document.querySelectorAll(".row-wrapper").length > 1) {
    animateRowRemove(wrapper, () => {
      wrapper.remove();
      updateRowControls();
    });
  }
});

// On load, always create a row (no addRowBtn)
const initialRow = createRow();
layoutContainer.appendChild(initialRow);
setTimeout(() => {
  initRowControls(initialRow);
  if (initialRow.updateDeleteBtnVisibility)
    initialRow.updateDeleteBtnVisibility();
}, 100);

// Patch setColumns and showColumnSelector to call autoSave
const origCreateRow = createRow;
createRow = function (...args) {
  const wrapper = origCreateRow.apply(this, args);
  // Patch setColumns
  if (wrapper.setColumns) {
    const origSetColumns = wrapper.setColumns;
    wrapper.setColumns = function (count) {
      origSetColumns.call(this, count);
      autoSaveLayout();
    };
  }
  // Patch showColumnSelector
  if (wrapper.showColumnSelector) {
    const origShowColSel = wrapper.showColumnSelector;
    wrapper.showColumnSelector = function () {
      origShowColSel.call(this);
      autoSaveLayout();
    };
  }
  return wrapper;
};

// Patch setColumns and showColumnSelector for all rows to enable autosave
function patchRowAutosave() {
  document.querySelectorAll(".row-wrapper").forEach((wrapper) => {
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
}

// Call patchRowAutosave after restoring layout
function restoreLayoutFromJson(layoutArr) {
  document.querySelectorAll(".row-wrapper").forEach((w) => w.remove());
  layoutArr.forEach((rowObj) => {
    const wrapper = createRow();
    layoutContainer.appendChild(wrapper);
    setTimeout(() => {
      initRowControls(wrapper);
      // Always set columns using the same logic as column selector
      if (rowObj.columns > 0) {
        // Try to find the setColumns function from the row context
        let row = wrapper.querySelector(".row");
        if (row && typeof row.setColumns === "function") {
          row.setColumns(rowObj.columns);
        } else if (typeof wrapper.setColumns === "function") {
          wrapper.setColumns(rowObj.columns);
        } else {
          // fallback: simulate click on the correct selector option
          const selectorOptions = wrapper.querySelectorAll(".selector-option");
          if (selectorOptions && selectorOptions.length) {
            const idx = [1, 2, 3, 4].indexOf(rowObj.columns);
            if (idx >= 0 && selectorOptions[idx]) selectorOptions[idx].click();
          }
        }
      }
    }, 0);
  });
  setTimeout(() => {
    updateRowControls();
    patchRowAutosave(); // Enable autosave for all rows
    enableLayoutAutosaveObserver(); // Robust autosave for all changes
  }, 100);
}
