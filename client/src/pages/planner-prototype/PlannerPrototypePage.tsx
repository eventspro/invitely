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
import GuestForm from "./forms/GuestForm";
import TableForm from "./forms/TableForm";
import BudgetItemForm from "./forms/BudgetItemForm";
import TaskForm from "./forms/TaskForm";
import GenerateTablesSheet from "./forms/GenerateTablesSheet";
import { loadData, saveData } from "./storage";
import { applySuggestion, uid } from "./plannerUtils";
import { PlannerLocaleProvider, usePlannerText } from "./PlannerLocaleContext";
import type { TabId, Guest, WeddingTable, BudgetItem, Seat, Task, PlannerData } from "./types";
import type { TableSuggestion } from "./plannerUtils";

interface PlannerPrototypePageProps {
  isDemoMode?: boolean;
  demoLimits?: { maxGuests: number; maxTables: number; maxBudgetItems: number };
  onDemoLimitReached?: (feature: string) => void;
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
}: PlannerPrototypePageProps) {
  const pt = usePlannerText();

  const NAV_TITLES: Record<TabId, string> = {
    dashboard: pt.nav.dashboard,
    guests: pt.nav.guests,
    tables: pt.nav.tables,
    budget: pt.nav.budget,
    more: pt.nav.more,
  };

  const [data, setData] = useState<PlannerData>(() => loadData());
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const [showTasksScreen, setShowTasksScreen] = useState(false);
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

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = useCallback((next: PlannerData) => {
    setData(next);
  }, []);

  function handleSaveGuest(g: Guest) {
    setData(prev => ({
      ...prev,
      guests: editingGuest
        ? prev.guests.map(x => x.id === g.id ? g : x)
        : [...prev.guests, g],
    }));
    setGuestSheetOpen(false);
    setEditingGuest(undefined);
  }

  function handleDeleteGuest(id: string) {
    setData(prev => ({
      ...prev,
      guests: prev.guests.filter(g => g.id !== id),
      seats: prev.seats.map(s => s.guestId === id ? { ...s, guestId: undefined } : s),
    }));
  }

  function handleSaveTable(t: WeddingTable) {
    if (editingTable) {
      setData(prev => {
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
      setData(prev => ({
        ...prev,
        tables: [...prev.tables, t],
        seats: [...prev.seats, ...newSeats],
      }));
    }
    setTableSheetOpen(false);
    setEditingTable(undefined);
  }

  function handleDeleteTable(id: string) {
    setData(prev => ({
      ...prev,
      tables: prev.tables.filter(t => t.id !== id),
      seats: prev.seats.filter(s => s.tableId !== id),
      guests: prev.guests.map(g => g.tableId === id ? { ...g, tableId: undefined, seatId: undefined } : g),
    }));
  }

  function handleAssignSeat(seatId: string, guestId: string) {
    setData(prev => {
      const seat = prev.seats.find(s => s.id === seatId);
      if (!seat) return prev;
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
    setData(prev => {
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
    setData(prev => ({
      ...prev,
      budgetItems: editingBudget
        ? prev.budgetItems.map(x => x.id === item.id ? item : x)
        : [...prev.budgetItems, item],
    }));
    setBudgetSheetOpen(false);
    setEditingBudget(undefined);
  }

  function handleDeleteBudget(id: string) {
    setData(prev => ({ ...prev, budgetItems: prev.budgetItems.filter(i => i.id !== id) }));
  }

  function handleSaveTask(task: Task) {
    setData(prev => ({
      ...prev,
      tasks: editingTask
        ? prev.tasks.map(t => t.id === task.id ? task : t)
        : [...prev.tasks, task],
    }));
    setTaskSheetOpen(false);
    setEditingTask(undefined);
  }

  function handleDeleteTask(id: string) {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }

  function handleToggleTask(id: string) {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
    }));
  }

  function handleApplySuggestion(suggestion: TableSuggestion) {
    setData(prev => applySuggestion(prev, suggestion));
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

  if (showTasksScreen) {
    return (
      <>
        <PlannerShell
          active={activeTab}
          onChange={(tab) => { setActiveTab(tab); setShowTasksScreen(false); }}
          settings={data.settings}
          headerTitle={pt.tasks.title}
          showBack
          onBack={() => setShowTasksScreen(false)}
          isDemoMode={isDemoMode}
          onDemoContactUs={() => onDemoLimitReached?.("more")}
          headerRight={
            <button
              onClick={() => { setEditingTask(undefined); setTaskSheetOpen(true); }}
              style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
            >
              <Plus size={15} /> {pt.common.add}
            </button>
          }
        >
          <TasksScreen
            tasks={data.tasks}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
            onAdd={() => { setEditingTask(undefined); setTaskSheetOpen(true); }}
            onEdit={task => { setEditingTask(task); setTaskSheetOpen(true); }}
          />
        </PlannerShell>

        <BottomSheet
          open={taskSheetOpen}
          onClose={() => { setTaskSheetOpen(false); setEditingTask(undefined); }}
          title={editingTask ? pt.tasks.editTask : pt.tasks.addTask}
          height="auto"
        >
          <TaskForm
            initial={editingTask}
            onSave={handleSaveTask}
            onCancel={() => { setTaskSheetOpen(false); setEditingTask(undefined); }}
          />
        </BottomSheet>
      </>
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
      >
        {activeTab === "dashboard" && <DashboardScreen data={data} onNavigate={(tab) => setActiveTab(tab)} onViewTasks={() => setShowTasksScreen(true)} onToggleTask={handleToggleTask} />}

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
            onAdd={() => { setEditingBudget(undefined); setBudgetSheetOpen(true); }}
            onEdit={item => { setEditingBudget(item); setBudgetSheetOpen(true); }}
            onDelete={handleDeleteBudget}
          />
        )}

        {activeTab === "more" && (
          <MoreScreen data={data} onUpdate={updateData} isDemoMode={isDemoMode} onContactUs={() => onDemoLimitReached?.("more")} />
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
    </>
  );
}
