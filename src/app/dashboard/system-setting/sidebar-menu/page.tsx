"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    GripVertical,
    Plus,
    Minus
} from "lucide-react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from "@hello-pangea/dnd";

// Mock Data
const initialAvailableItems = [
    { id: "quick-fees", content: "Quick Fees" },
    { id: "thermal-print", content: "Thermal Print" },
    { id: "whatsapp-messaging", content: "Whatsapp Messaging" },
];

const initialSelectedItems = [
    { id: "front-office", content: "Front Office" },
    { id: "student-information", content: "Student Information" },
    { id: "fees-collection", content: "Fees Collection" },
    { id: "online-course", content: "Online Course" },
    { id: "tfa", content: "TFA" },
    { id: "behaviour-records", content: "Behaviour Records" },
    { id: "multi-branch", content: "Multi Branch" },
    { id: "gmeet-live-classes", content: "Gmeet Live Classes" },
    { id: "zoom-live-classes", content: "Zoom Live Classes" },
    { id: "income", content: "Income" },
    { id: "expenses", content: "Expenses" },
    { id: "qr-code-attendance", content: "QR Code Attendance" },
    { id: "cbse-examination", content: "CBSE Examination" },
    { id: "examinations", content: "Examinations" },
    { id: "attendance", content: "Attendance" },
    { id: "online-examinations", content: "Online Examinations" },
    { id: "academics", content: "Academics" },
    { id: "annual-calendar", content: "Annual Calendar" },
    { id: "lesson-plan", content: "Lesson Plan" },
    { id: "human-resource", content: "Human Resource" },
    { id: "communicate", content: "Communicate" },
    { id: "download-center", content: "Download Center" },
    { id: "homework", content: "Homework" },
    { id: "library", content: "Library" },
    { id: "inventory", content: "Inventory" },
    { id: "student-cv", content: "Student CV" },
    { id: "transport", content: "Transport" },
    { id: "hostel", content: "Hostel" },
    { id: "certificate", content: "Certificate" },
    { id: "front-cms", content: "Front CMS" },
    { id: "alumni", content: "Alumni" },
    { id: "reports", content: "Reports" },
    { id: "system-setting", content: "System Setting" },
];

export default function SidebarMenuPage() {
    const [availableItems, setAvailableItems] = useState(initialAvailableItems);
    const [selectedItems, setSelectedItems] = useState(initialSelectedItems);

    // Simplified moving function for demo (no DnD yet for simplicity, just click to move)
    // Or implement actual DnD if desired. For UI mockup, simple click toggle is often enough, 
    // but DnD is better for "Sorting". Let's stick to a clean UI first.

    const moveToSelected = (item: { id: string, content: string }) => {
        setAvailableItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedItems(prev => [...prev, item]);
    };

    const moveToAvailable = (item: { id: string, content: string }) => {
        setSelectedItems(prev => prev.filter(i => i.id !== item.id));
        setAvailableItems(prev => [...prev, item]);
    };

    // Reorder function (placeholder for DnD logic)
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const sourceList = result.source.droppableId === 'available' ? availableItems : selectedItems;
        const destList = result.destination.droppableId === 'available' ? availableItems : selectedItems;

        // Logic for reordering or moving between lists would go here
        // For this UI demo, we'll implement simple reordering within the same list 
        // and moving between lists if needed.

        // BUT since we are mocking the UI primarily, let's implement basic reordering for "selected" list
        if (result.source.droppableId === 'selected' && result.destination.droppableId === 'selected') {
            const items = Array.from(selectedItems);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setSelectedItems(items);
        }
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[800px]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                    <h1 className="text-[16px] font-medium text-gray-700">Sidebar Menu</h1>
                </div>

                {/* Content */}
                <div className="p-6">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">

                            {/* Left Column: Menu List (Available) */}
                            <div className="flex flex-col h-full border border-gray-200 rounded-md bg-white">
                                <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                                    <h2 className="text-[13px] font-semibold text-gray-600">Menu List</h2>
                                </div>
                                <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[700px]">
                                    {/* Static items for now since we focus on UI structure */}
                                    {availableItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
                                            onClick={() => moveToSelected(item)}
                                        >
                                            <span className="text-[13px] text-gray-700 font-medium">{item.content}</span>
                                            <Plus className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                                        </div>
                                    ))}
                                    {availableItems.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-[12px]">
                                            No items available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Selected Sidebar Menus */}
                            <Droppable droppableId="selected">
                                {(provided: any) => (
                                    <div
                                        className="flex flex-col h-full border border-gray-200 rounded-md bg-white"
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                                            <h2 className="text-[13px] font-semibold text-gray-600">Selected Sidebar Menus</h2>
                                        </div>
                                        <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[700px]">
                                            {selectedItems.map((item, index) => (
                                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                                    {(providedSnapshot: any) => (
                                                        <div
                                                            ref={providedSnapshot.innerRef}
                                                            {...providedSnapshot.draggableProps}
                                                            {...providedSnapshot.dragHandleProps}
                                                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded hover:border-indigo-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing group bg-white"
                                                            style={{ ...providedSnapshot.draggableProps.style }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <GripVertical className="h-4 w-4 text-gray-300" />
                                                                <span className="text-[13px] text-gray-700 font-medium">{item.content}</span>
                                                            </div>
                                                            <div
                                                                className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    moveToAvailable(item);
                                                                }}
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>

                        </div>
                    </DragDropContext>

                    {/* Footer Action */}
                    <div className="flex justify-end pt-6 mt-4 border-t border-gray-50">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                            Save
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
