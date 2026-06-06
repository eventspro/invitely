import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import PlannerShell from "./PlannerShell";
import DashboardScreen from "./screens/DashboardScreen";
import GuestsScreen from "./screens/GuestsScreen";
import TablesScreen from "./screens/TablesScreen";
import TasksScreen from "./screens/TasksScreen";
import SeatAssignmentScreen from "./screens/SeatAssignmentScreen";
import BudgetScreen from "./screens/BudgetScreen";
import MoreScreen from "./screens/MoreScreen";
import BottomSheet from "./components/BottomSheet";
import LoginGreetingBanner from "./components/LoginGreetingBanner";
import GuestForm from "./forms/GuestForm";
import TableForm from "./forms/TableForm";
import BudgetItemForm from "./forms/BudgetItemForm";
import TaskForm from "./forms/TaskForm";
import GenerateTablesSheet from "./forms/GenerateTablesSheet";
import { loadData, saveData } from "./storage";
import { BLANK_DATA } from "./defaultData";
import {
  applySuggestion,
  canAssignGuestToTable,
  getGuestSeatCount,
  getTableFreeSeats,
  uid,
} from "./plannerUtils";
import { PlannerLocaleProvider, usePlannerText } from "./PlannerLocaleContext";
import { importLegacyPlannerData, savePlannerData } from "./api/plannerDataApi";
import { listTasks, createTask, updateTask, deleteTask } from "./api/tasksApi";
import type { TabId, Guest, WeddingTable, BudgetItem, Seat, Task, PlannerData } from "./types";
import type { TableSuggestion } from "./plannerUtils";

interface PlannerPrototypePageProps {
  isDemoMode?: boolean;
  demoLimits?: { maxGuests: number; maxTables: number; maxBudgetItems: number };
  onDemoLimitReached?: (feature: string) => void;
  userDisplayName?: string;
  onLogout?: () => void;
  storageKey?: string;
  initialData?: PlannerData;
  legacyData?: PlannerData;
  onLegacyImported?: () => void;
  token?: string;
  templateId?: string;
}

export default function PlannerPrototypePage(props: PlannerPrototypePageProps = {}) {
  return (
    <PlannerLocaleProvider>
      <PlannerPrototypeContent {...props} />
    </PlannerLocaleProvider>
  );
}

function PlannerPrototypeContent({
  isDemoMode = false,
  demoLimits = { maxGuests: 5, maxTables: 2, maxBudgetItems: 5 },
  onDemoLimitReached,
  userDisplayName,
  onLogout,
  storageKey,
  initialData,
  legacyData,
  onLegacyImported,
  token,
  templateId,
}: PlannerPrototypePageProps) {
  const pt = usePlannerText();

  const isApiMode = !isDemoMode && !!token && !!templateId;

  const NAV_TITLES: Record<TabId, string> = {
    dashboard: pt.nav.dashboard,
    guests: pt.nav.guests,
    tables: pt.nav.tables,
    tasks: pt.tasks.title,
    budget: pt.nav.budget,
    more: pt.nav.more,
  };

  const [data, setData] = useState<PlannerData>(() => (
    isApiMode ? structuredClone(initialData ?? BLANK_DATA) : loadData(storageKey, initialData)
  ));
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const [tableSheetOpen, setTableSheetOpen] = useState(false);
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);

  const [editingGuest, setEditingGuest] = useState<Guest | undefined>(undefined);
  const [editingTable, setEditingTable] = useState<WeddingTable | undefined>(undefined);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // API-mode task state
  const [apiTasks, setApiTasks] = useState<Task[]>([]);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [showImportPrompt, setShowImportPrompt] = useState(false);
  const [showLegacyImportPrompt, setShowLegacyImportPrompt] = useState(false);

  // Greeting banner — shown once per session when pending tasks exist
  const greetingKey = isApiMode ? `planner_greeting_shown_${templateId}` : null;
  const [showGreeting, setShowGreeting] = useState(false);

  function hasPlannerContent(value?: PlannerData): boolean {
    if (!value) return false;
    return (
      value.guests.length > 0 ||
      value.tables.length > 0 ||
      value.seats.length > 0 ||
      value.budgetItems.length > 0 ||
      value.tasks.length > 0 ||
      Boolean(value.settings.coupleName || value.settings.weddingDate)
    );
  }

  useEffect(() => {
    if (isApiMode) return;
    saveData(data, storageKey);
  }, [data, storageKey, isApiMode]);

  useEffect(() => {
    if (!isApiMode) return;
    setData(structuredClone(initialData ?? BLANK_DATA));
  }, [isApiMode, initialData, templateId]);

  useEffect(() => {
    setShowLegacyImportPrompt(isApiMode && hasPlannerContent(legacyData));
  }, [isApiMode, legacyData]);

  // Fetch API tasks + telegram status on mount
  useEffect(() => {
    if (!isApiMode) return;

    listTasks(templateId!, token!)
      .then(tasks => {
        setApiTasks(tasks);
        const legacyTasks = legacyData?.tasks ?? data.tasks;
        if (tasks.length === 0 && legacyTasks.length > 0) {
          setShowImportPrompt(true);
        }
        // Show greeting if not dismissed this session and there are pending tasks
        const alreadyShown = greetingKey ? sessionStorage.getItem(greetingKey) : null;
        if (!alreadyShown && tasks.some(t => t.status === "pending" && !t.done)) {
          setShowGreeting(true);
        }
      })
      .catch(err => console.error("[tasks] fetch error:", err));

    fetch(`/api/planner/telegram-status/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((d: { telegramConnected?: boolean }) => setTelegramConnected(d.telegramConnected ?? false))
      .catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode]);

  const effectiveTasks = isApiMode ? apiTasks : data.tasks;
  const effectiveData: PlannerData = isApiMode ? { ...data, tasks: apiTasks } : data;

  const persistData = useCallback((next: PlannerData) => {
    if (!isApiMode || !templateId || !token) return;
    savePlannerData(templateId, token, next)
      .then(saved => setData(saved))
      .catch(err => console.error("[planner-data] save error:", err));
  }, [isApiMode, templateId, token]);

  const commitData = useCallback((nextOrUpdater: PlannerData | ((prev: PlannerData) => PlannerData)) => {
    setData(prev => {
      const next = typeof nextOrUpdater === "function"
        ? (nextOrUpdater as (prev: PlannerData) => PlannerData)(prev)
        : nextOrUpdater;
      persistData(next);
      return next;
    });
  }, [persistData]);

  const updateData = useCallback((next: PlannerData) => {
    commitData(next);
  }, [commitData]);

  async function handleImportLegacyPlannerData() {
    if (!isApiMode || !templateId || !token || !legacyData) return;
    try {
      const imported = await importLegacyPlannerData(templateId, token, legacyData);
      setData(imported);
      setShowLegacyImportPrompt(false);
      onLegacyImported?.();
    } catch (err) {
      console.error("[planner-data] legacy import error:", err);
    }
  }

  function handleSaveGuest(g: Guest) {
    commitData(prev => ({
      ...prev,
      guests: editingGuest
        ? prev.guests.map(x => x.id === g.id ? g : x)
        : [...prev.guests, g],
    }));
    setGuestSheetOpen(false);
    setEditingGuest(undefined);
  }

  function handleDeleteGuest(id: string) {
    commitData(prev => ({
      ...prev,
      guests: prev.guests.filter(g => g.id !== id),
      seats: prev.seats.map(s => s.guestId === id ? { ...s, guestId: undefined } : s),
    }));
  }

  function handleSaveTable(t: WeddingTable) {
    if (editingTable) {
      commitData(prev => {
        let seats = prev.seats.filter(s => s.tableId !== t.id);
        for (let i = 1; i <= t.capacity; i++) {
          const oldSeat = prev.seats.find(s => s.tableId === t.id && s.seatNumber === i);
          seats.push(oldSeat ?? { id: uid(), tableId: t.id, seatNumber: i });
        }
        const keptSeatIds = new Set(seats.map(s => s.id));
        const guests = prev.guests.map(g =>
          g.seatId && !keptSeatIds.has(g.seatId) ? { ...g, tableId: undefined, seatId: undefined } : g
        );
        return { ...prev, tables: prev.tables.map(x => x.id === t.id ? t : x), seats, guests };
      });
    } else {
      const newSeats: Seat[] = Array.from({ length: t.capacity }, (_, i) => ({
        id: uid(),
        tableId: t.id,
        seatNumber: i + 1,
      }));
      commitData(prev => ({
        ...prev,
        tables: [...prev.tables, t],
        seats: [...prev.seats, ...newSeats],
      }));
    }
    setTableSheetOpen(false);
    setEditingTable(undefined);
  }

  function handleDeleteTable(id: string) {
    commitData(prev => ({
      ...prev,
      tables: prev.tables.filter(t => t.id !== id),
      seats: prev.seats.filter(s => s.tableId !== id),
      guests: prev.guests.map(g => g.tableId === id ? { ...g, tableId: undefined, seatId: undefined } : g),
    }));
  }

  function handleAssignSeat(seatId: string, guestId: string) {
    commitData(prev => {
      const seat = prev.seats.find(s => s.id === seatId);
      if (!seat) return prev;

      const table = prev.tables.find(t => t.id === seat.tableId);
      if (!table) return prev;

      const guest = prev.guests.find(g => g.id === guestId);
      if (!guest) return prev;

      if (!canAssignGuestToTable(table, guest, prev.guests)) {
        const neededSeats = getGuestSeatCount(guest);
        const freeSeats = getTableFreeSeats(table, prev.guests, guest.id);

        alert(
          `${guest.fullName} needs ${neededSeats} seats, but ${table.name} has only ${freeSeats} free seats.`
        );

        return prev;
      }

      const seats = prev.seats.map(s => {
        if (s.id === seatId) return { ...s, guestId };
        if (s.guestId === guestId) return { ...s, guestId: undefined };
        return s;
      });

      const guests = prev.guests.map(g =>
        g.id === guestId ? { ...g, tableId: seat.tableId, seatId } : g
      );

      return { ...prev, seats, guests };
    });
  }

  function handleUnassignSeat(seatId: string) {
    commitData(prev => {
      const seat = prev.seats.find(s => s.id === seatId);
      if (!seat || !seat.guestId) return prev;
      const guestId = seat.guestId;
      return {
        ...prev,
        seats: prev.seats.map(s => s.id === seatId ? { ...s, guestId: undefined } : s),
        guests: prev.guests.map(g => g.id === guestId ? { ...g, tableId: undefined, seatId: undefined } : g),
      };
    });
  }

  function handleSaveBudget(item: BudgetItem) {
    commitData(prev => ({
      ...prev,
      budgetItems: editingBudget
        ? prev.budgetItems.map(x => x.id === item.id ? item : x)
        : [...prev.budgetItems, item],
    }));
    setBudgetSheetOpen(false);
    setEditingBudget(undefined);
  }

  function handleDeleteBudget(id: string) {
    commitData(prev => ({ ...prev, budgetItems: prev.budgetItems.filter(i => i.id !== id) }));
  }

  async function handleSaveTask(task: Task) {
    if (isApiMode) {
      try {
        const input = {
          title: task.title,
          description: task.notes,
          priority: task.priority,
          dueAtLocal: task.dueAtLocal,
          timezone: task.timezone,
          reminderEnabled: task.reminderEnabled ?? false,
          repeatIntervalMinutes: task.repeatIntervalMinutes ?? null,
        };
        if (editingTask) {
          const updated = await updateTask(templateId!, editingTask.id, token!, input);
          setApiTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        } else {
          const created = await createTask(templateId!, token!, input);
          setApiTasks(prev => [created, ...prev]);
        }
      } catch (err) {
        console.error("[tasks] save error:", err);
      }
    } else {
      commitData(prev => ({
        ...prev,
        tasks: editingTask
          ? prev.tasks.map(t => t.id === task.id ? task : t)
          : [...prev.tasks, task],
      }));
    }
    setTaskSheetOpen(false);
    setEditingTask(undefined);
  }

  async function handleDeleteTask(id: string) {
    if (isApiMode) {
      try {
        await deleteTask(templateId!, id, token!);
        setApiTasks(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error("[tasks] delete error:", err);
      }
    } else {
      commitData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    }
  }

  async function handleToggleTask(id: string) {
    if (isApiMode) {
      const task = apiTasks.find(t => t.id === id);
      if (!task) return;
      try {
        const updated = await updateTask(templateId!, id, token!, {
          status: task.done ? "pending" : "done",
        });
        setApiTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      } catch (err) {
        console.error("[tasks] toggle error:", err);
      }
    } else {
      commitData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
      }));
    }
  }

  async function handleImportTasks() {
    const sourceTasks = legacyData?.tasks?.length ? legacyData.tasks : data.tasks;
    for (const task of sourceTasks) {
      try {
        const created = await createTask(templateId!, token!, {
          title: task.title,
          description: task.notes,
          priority: task.priority,
          dueAtLocal: task.dueAtLocal ?? (task.dueDate ? `${task.dueDate}T09:00` : undefined),
          timezone: task.timezone ?? "Asia/Yerevan",
          reminderEnabled: false,
        });
        setApiTasks(prev => [...prev, created]);
      } catch { /* skip individual failures */ }
    }
    setShowImportPrompt(false);
  }

  function handleDismissGreeting() {
    setShowGreeting(false);
    if (greetingKey) sessionStorage.setItem(greetingKey, "dismissed");
  }

  async function handleGreetingMarkDone(taskId: string) {
    await handleToggleTask(taskId);
    // If no more pending tasks after this, auto-hide greeting
    const stillPending = effectiveTasks.filter(t => t.id !== taskId && t.status === "pending" && !t.done);
    if (stillPending.length === 0) handleDismissGreeting();
  }

  function handleApplySuggestion(suggestion: TableSuggestion) {
    commitData(prev => applySuggestion(prev, suggestion));
  }

  const selectedTable = selectedTableId ? data.tables.find(t => t.id === selectedTableId) : undefined;
  if (selectedTable) {
    return (
      <SeatAssignmentScreen
        table={selectedTable}
        seats={data.seats.filter(s => s.tableId === selectedTable.id)}
        guests={data.guests}
        allSeats={data.seats}
        onAssign={handleAssignSeat}
        onUnassign={handleUnassignSeat}
        onBack={() => setSelectedTableId(null)}
      />
    );
  }

  const headerTitle = NAV_TITLES[activeTab];

  const headerRight = activeTab === "guests" ? (
    <button
      onClick={() => {
        if (isDemoMode && data.guests.length >= demoLimits.maxGuests) { onDemoLimitReached?.("guests"); return; }
        setEditingGuest(undefined); setGuestSheetOpen(true);
      }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : activeTab === "tables" ? (
    <button
      onClick={() => {
        if (isDemoMode && data.tables.length >= demoLimits.maxTables) { onDemoLimitReached?.("tables"); return; }
        setEditingTable(undefined); setTableSheetOpen(true);
      }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : activeTab === "tasks" ? (
    <button
      onClick={() => { setEditingTask(undefined); setTaskSheetOpen(true); }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : activeTab === "budget" ? (
    <button
      onClick={() => {
        if (isDemoMode && data.budgetItems.length >= demoLimits.maxBudgetItems) { onDemoLimitReached?.("budget"); return; }
        setEditingBudget(undefined); setBudgetSheetOpen(true);
      }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : undefined;

  return (
    <>
      <PlannerShell
        active={activeTab}
        onChange={setActiveTab}
        settings={data.settings}
        headerTitle={headerTitle}
        headerRight={headerRight}
        isDemoMode={isDemoMode}
        onDemoContactUs={() => onDemoLimitReached?.("more")}
        userDisplayName={userDisplayName}
        onLogout={onLogout}
      >
        {activeTab === "dashboard" && (
          <>
            {showLegacyImportPrompt && isApiMode && legacyData && (
              <div style={{
                background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 12,
                padding: "12px 14px", margin: "12px 16px 0", display: "flex",
                alignItems: "center", justifyContent: "space-between", gap: 10,
                flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 700 }}>
                    {pt.more.importLocalData}
                  </div>
                  <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 2 }}>
                    {pt.more.importLocalDataDesc}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleImportLegacyPlannerData}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#2563EB", color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {pt.tasks.importBtn}
                  </button>
                  <button
                    onClick={() => setShowLegacyImportPrompt(false)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #93C5FD", background: "transparent", color: "#1D4ED8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    {pt.tasks.importLater}
                  </button>
                </div>
              </div>
            )}
            {showGreeting && isApiMode && (
              <div style={{ padding: "12px 14px 0" }}>
                <LoginGreetingBanner
                  tasks={effectiveTasks}
                  firstName={data.settings.coupleName.split(/\s*&\s*|\s+and\s+/i)[0].trim().split(" ")[0]}
                  onDismiss={handleDismissGreeting}
                  onViewTasks={() => { handleDismissGreeting(); setActiveTab("tasks"); }}
                  onMarkDone={handleGreetingMarkDone}
                />
              </div>
            )}
            <DashboardScreen data={effectiveData} onNavigate={(tab) => setActiveTab(tab)} onViewTasks={() => setActiveTab("tasks")} onToggleTask={handleToggleTask} />
          </>
        )}

        {activeTab === "tasks" && (
          <>
            {showImportPrompt && (
              <div style={{
                background: "#FFF3E0", border: "1px solid #D7951E", borderRadius: 12,
                padding: "12px 14px", margin: "12px 16px 0", display: "flex",
                alignItems: "center", justifyContent: "space-between", gap: 10,
                flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 13, color: "#92400E", fontWeight: 500, flex: 1 }}>
                  {pt.tasks.importTasks}
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleImportTasks}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#D7951E", color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {pt.tasks.importBtn}
                  </button>
                  <button
                    onClick={() => setShowImportPrompt(false)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #D7951E", background: "transparent", color: "#92400E", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    {pt.tasks.importLater}
                  </button>
                </div>
              </div>
            )}
            <TasksScreen
              tasks={effectiveTasks}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onAdd={() => { setEditingTask(undefined); setTaskSheetOpen(true); }}
              onEdit={task => { setEditingTask(task); setTaskSheetOpen(true); }}
            />
          </>
        )}

        {activeTab === "guests" && (
          <GuestsScreen
            guests={data.guests}
            tables={data.tables}
            seats={data.seats}
            onAdd={() => { setEditingGuest(undefined); setGuestSheetOpen(true); }}
            onEdit={g => { setEditingGuest(g); setGuestSheetOpen(true); }}
            onDelete={handleDeleteGuest}
          />
        )}

        {activeTab === "tables" && (
          <TablesScreen
            tables={data.tables}
            seats={data.seats}
            guests={data.guests}
            onAdd={() => { setEditingTable(undefined); setTableSheetOpen(true); }}
            onEdit={t => { setEditingTable(t); setTableSheetOpen(true); }}
            onDelete={handleDeleteTable}
            onManageSeats={id => {
              if (isDemoMode) { onDemoLimitReached?.("seats"); return; }
              setSelectedTableId(id);
            }}
            onGenerate={() => setGenerateSheetOpen(true)}
          />
        )}

        {activeTab === "budget" && (
          <BudgetScreen
            budgetItems={data.budgetItems}
            currency={data.settings.currency}
            settings={data.settings}
            onAdd={() => { setEditingBudget(undefined); setBudgetSheetOpen(true); }}
            onEdit={item => { setEditingBudget(item); setBudgetSheetOpen(true); }}
            onDelete={handleDeleteBudget}
            onUpdateSettings={s => commitData(prev => ({ ...prev, settings: s }))}
          />
        )}

        {activeTab === "more" && (
          <MoreScreen data={data} onUpdate={updateData} isDemoMode={isDemoMode} onContactUs={() => onDemoLimitReached?.("more")} storageKey={storageKey} token={token} templateId={templateId} />
        )}
      </PlannerShell>

      <BottomSheet
        open={guestSheetOpen}
        onClose={() => { setGuestSheetOpen(false); setEditingGuest(undefined); }}
        title={editingGuest ? pt.guests.editGuest : pt.guests.addGuest}
        height="tall"
      >
        <GuestForm
          initial={editingGuest}
          onSave={handleSaveGuest}
          onCancel={() => { setGuestSheetOpen(false); setEditingGuest(undefined); }}
        />
      </BottomSheet>

      <BottomSheet
        open={tableSheetOpen}
        onClose={() => { setTableSheetOpen(false); setEditingTable(undefined); }}
        title={editingTable ? pt.tables.editTable : pt.tables.addTable}
        height="auto"
      >
        <TableForm
          initial={editingTable}
          onSave={handleSaveTable}
          onCancel={() => { setTableSheetOpen(false); setEditingTable(undefined); }}
        />
      </BottomSheet>

      <BottomSheet
        open={budgetSheetOpen}
        onClose={() => { setBudgetSheetOpen(false); setEditingBudget(undefined); }}
        title={editingBudget ? pt.budget.editExpense : pt.budget.addExpense}
        height="tall"
      >
        <BudgetItemForm
          initial={editingBudget}
          currency={data.settings.currency}
          onSave={handleSaveBudget}
          onCancel={() => { setBudgetSheetOpen(false); setEditingBudget(undefined); }}
        />
      </BottomSheet>

      <BottomSheet
        open={generateSheetOpen}
        onClose={() => setGenerateSheetOpen(false)}
        title={pt.generator.title}
        height="tall"
      >
        <GenerateTablesSheet
          data={data}
          onApply={handleApplySuggestion}
          onClose={() => setGenerateSheetOpen(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={taskSheetOpen}
        onClose={() => { setTaskSheetOpen(false); setEditingTask(undefined); }}
        title={editingTask ? pt.tasks.editTask : pt.tasks.addTask}
        height="auto"
      >
        <TaskForm
          initial={editingTask}
          telegramConnected={telegramConnected}
          isDemoMode={isDemoMode}
          onSave={handleSaveTask}
          onCancel={() => { setTaskSheetOpen(false); setEditingTask(undefined); }}
        />
      </BottomSheet>
    </>
  );
}
