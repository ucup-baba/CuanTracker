import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { availableColors, WALLETS } from '../constants';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COMMON_ICONS = [
    // Finance / Money
    "DollarSign", "Wallet", "PiggyBank", "Landmark", "BadgeDollarSign", "Coins", "Banknote", "CreditCard", "Receipt", "TrendingUp", "TrendingDown",
    // Food & Drink
    "Coffee", "Utensils", "UtensilsCrossed", "Pizza", "Wine", "CupSoda", "Croissant",
    // Transport & Vehicles
    "Car", "Bus", "Train", "Plane", "Ship", "Bike", "Fuel", "MapPin", "Navigation",
    // Shopping & Retail
    "ShoppingBag", "ShoppingCart", "Store", "Tag", "Package", "Gift", "Shirt",
    // Home & Living
    "Home", "Building", "Bed", "Sofa", "Lightbulb", "Flashlight", "Flame", "Droplets",
    // Tech & Media
    "Monitor", "Smartphone", "Laptop", "Wifi", "Tv", "Headphones", "Music", "Video", "Camera", "Mic", "Gamepad2",
    // Health & Wellness
    "Heart", "Activity", "HeartPulse", "Stethoscope", "Pill", "Dumbbell", "Smile",
    // Work & Education
    "GraduationCap", "School", "Library", "Backpack", "Book", "BookOpen", "Pencil", "Ruler", "Calculator", "Briefcase", "PenTool", "Scissors", "Wrench", "Hammer",
    // Miscellaneous
    "Star", "Zap", "Shield", "Trophy", "Award", "Ticket", "Umbrella", "SmilePlus"
];

// Sortable Category Item Component
const SortableCategoryItem = ({ id, cat, categoryData, isEditing, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex justify-between items-center p-3 border-4 border-black transition-colors ${isDragging ? 'opacity-50 border-dashed bg-gray-100 scale-105' : ''} ${isEditing ? 'bg-black text-white translate-x-1' : 'bg-white hover:bg-gray-100'}`}
            onClick={() => onEdit(cat)}
        >
            <div className="flex items-center gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-black p-1 -ml-2 rounded-md z-20 touch-none"
                    onClick={(e) => e.stopPropagation()} // Prevent clicking grip from triggering edit
                >
                    <Icons.GripVertical size={20} />
                </div>
                <div className={`p-1 border-2 ${isEditing ? 'border-white bg-white text-black' : 'border-black ' + getCategoryColor(categoryData.color)}`}>
                    <CategoryIcon iconName={categoryData.icon} size={20} />
                </div>
                <span className="font-bold uppercase text-sm truncate max-w-[120px]">{cat}</span>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(cat); }}
                className={`p-1 hover:bg-red-500 hover:text-white transition-colors ${isEditing ? 'text-gray-300' : 'text-gray-400'}`}
                title="Hapus Kategori"
            >
                <Icons.Trash2 size={16} />
            </button>
        </div>
    );
};

const Settings = ({
    pribadiCategories, pribadiIncomeCategories,
    asramaCategories, asramaIncomeCategories,
    onSaveCategories, onBack, setDirty
}) => {
    const [activeSettingsWallet, setActiveSettingsWallet] = useState('pribadi');
    const [activeTab, setActiveTab] = useState('expense');

    // Get the right categories for current wallet+tab
    const getCats = () => {
        if (activeSettingsWallet === 'pribadi') {
            return activeTab === 'expense' ? JSON.parse(JSON.stringify(pribadiCategories)) : JSON.parse(JSON.stringify(pribadiIncomeCategories));
        }
        return activeTab === 'expense' ? JSON.parse(JSON.stringify(asramaCategories)) : JSON.parse(JSON.stringify(asramaIncomeCategories));
    };

    const [localCategories, setLocalCategories] = useState(getCats());
    const [editingCategory, setEditingCategory] = useState(null);
    const [newSubCategoryName, setNewSubCategoryName] = useState("");
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatIcon, setNewCatIcon] = useState("DollarSign");
    const [newCatColor, setNewCatColor] = useState("bg-black");
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, catName: null });
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
    const [switchTarget, setSwitchTarget] = useState(null);

    // Setup DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const isDirty = useMemo(() => {
        const originalCats = activeSettingsWallet === 'pribadi'
            ? (activeTab === 'expense' ? pribadiCategories : pribadiIncomeCategories)
            : (activeTab === 'expense' ? asramaCategories : asramaIncomeCategories);
        return JSON.stringify(localCategories) !== JSON.stringify(originalCats);
    }, [localCategories, activeSettingsWallet, activeTab, pribadiCategories, pribadiIncomeCategories, asramaCategories, asramaIncomeCategories]);

    useEffect(() => {
        if (setDirty) setDirty(isDirty);

        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Standard way to show prompt
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, setDirty]);

    const refreshLocal = (walletId, tabType) => {
        let cats;
        if (walletId === 'pribadi') {
            cats = tabType === 'expense' ? pribadiCategories : pribadiIncomeCategories;
        } else {
            cats = tabType === 'expense' ? asramaCategories : asramaIncomeCategories;
        }
        setLocalCategories(JSON.parse(JSON.stringify(cats)));
        setEditingCategory(null);
        setIsCreatingNew(false);
        setNewSubCategoryName("");
    };

    const executeSwitch = (type, value) => {
        if (type === 'wallet') {
            setActiveSettingsWallet(value);
            refreshLocal(value, activeTab);
        } else {
            setActiveTab(value);
            refreshLocal(activeSettingsWallet, value);
        }
        setSwitchTarget(null);
    };

    const handleSwitchWallet = (w) => {
        if (w === activeSettingsWallet) return;
        if (isDirty) {
            setSwitchTarget({ type: 'wallet', value: w });
        } else {
            executeSwitch('wallet', w);
        }
    };

    const handleSwitchTab = (t) => {
        if (t === activeTab) return;
        if (isDirty) {
            setSwitchTarget({ type: 'tab', value: t });
        } else {
            executeSwitch('tab', t);
        }
    };

    const handleSave = () => {
        onSaveCategories(activeSettingsWallet, activeTab, localCategories);
    };

    const handleDeleteCategory = (catName) => {
        setConfirmModal({ isOpen: true, catName });
    };

    const confirmDeleteCategory = () => {
        const catName = confirmModal.catName;
        const updated = { ...localCategories };
        delete updated[catName];
        setLocalCategories(updated);
        if (editingCategory === catName) setEditingCategory(null);
        setConfirmModal({ isOpen: false, catName: null });
    };

    const handleAddSubCategory = (e) => {
        e.preventDefault();
        if (!newSubCategoryName.trim()) return;
        const updated = { ...localCategories };
        if (!updated[editingCategory].subCategories.includes(newSubCategoryName.trim())) {
            updated[editingCategory].subCategories.push(newSubCategoryName.trim());
            setLocalCategories(updated);
        }
        setNewSubCategoryName("");
    };

    const handleDeleteSubCategory = (subCatName) => {
        const updated = { ...localCategories };
        updated[editingCategory].subCategories = updated[editingCategory].subCategories.filter(s => s !== subCatName);
        setLocalCategories(updated);
    };

    const handleUpdateCategoryAppearance = (icon, color) => {
        const updated = { ...localCategories };
        if (icon) updated[editingCategory].icon = icon;
        if (color) updated[editingCategory].color = color;
        setLocalCategories(updated);
    };

    const handleCreateNewCategory = (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        if (localCategories[newCatName.trim()]) {
            setAlertModal({ isOpen: true, message: "Nama kategori ini sudah ada Bos!" });
            return;
        }
        const updated = { ...localCategories };
        updated[newCatName.trim()] = { icon: newCatIcon, color: newCatColor, subCategories: ["Lainnya"] };
        setLocalCategories(updated);
        setIsCreatingNew(false);
        setNewCatName("");
        setNewCatIcon("DollarSign");
        setNewCatColor("bg-black");
    };

    // --- DnD Reorder Handler ---
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setLocalCategories((items) => {
                const keys = Object.keys(items);
                const oldIndex = keys.indexOf(active.id);
                const newIndex = keys.indexOf(over.id);

                const newKeys = arrayMove(keys, oldIndex, newIndex);

                // Rebuild the object
                const newLocalCategories = {};
                newKeys.forEach(k => {
                    newLocalCategories[k] = items[k];
                });

                return newLocalCategories;
            });
        }
    };

    const walletInfo = WALLETS[activeSettingsWallet];

    return (
        <div className="bg-white border-4 border-black p-4 md:p-8 pop-shadow mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-4 border-black pb-4 gap-4">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Pengaturan<br />Kategori</h2>
                <div className="flex gap-4 flex-wrap">
                    <button onClick={onBack} className="bg-white text-black font-black uppercase tracking-widest px-4 py-2 border-4 border-black hover:bg-gray-100 transition-colors pop-shadow-sm">
                        Batal
                    </button>
                    <button onClick={handleSave} className="bg-green-400 text-black font-black uppercase tracking-widest px-4 py-2 border-4 border-black hover:bg-green-300 transition-colors pop-shadow-sm">
                        Simpan
                    </button>
                </div>
            </div>

            {/* Wallet Selector */}
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => handleSwitchWallet('pribadi')}
                    className={`flex-1 py-3 border-4 border-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${activeSettingsWallet === 'pribadi' ? 'bg-yellow-400 text-black pop-shadow-sm scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    <span className={`p-1 border-2 ${activeSettingsWallet === 'pribadi' ? 'border-black bg-white' : 'border-gray-300 bg-white'}`}>
                        <Icons.Wallet size={16} strokeWidth={3} />
                    </span>
                    Pribadi
                </button>
                <button
                    onClick={() => handleSwitchWallet('asrama')}
                    className={`flex-1 py-3 border-4 border-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${activeSettingsWallet === 'asrama' ? 'bg-indigo-400 text-white pop-shadow-sm scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    <span className={`p-1 border-2 ${activeSettingsWallet === 'asrama' ? 'border-black bg-white text-black' : 'border-gray-300 bg-white'}`}>
                        <Icons.Home size={16} strokeWidth={3} />
                    </span>
                    Asrama
                </button>
            </div>

            {/* Tab: Pengeluaran vs Pemasukan */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => handleSwitchTab('expense')}
                    className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-3 ${activeTab === 'expense' ? 'bg-red-500 text-white pop-shadow scale-105 z-10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    <span className={`p-2 border-4 ${activeTab === 'expense' ? 'border-black bg-white text-red-500' : 'border-gray-300 bg-white text-gray-400'}`}>
                        <Icons.TrendingDown size={24} strokeWidth={3} />
                    </span>
                    Pengeluaran
                </button>
                <button
                    onClick={() => handleSwitchTab('income')}
                    className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-3 ${activeTab === 'income' ? 'bg-green-400 text-black pop-shadow scale-105 z-10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                    <span className={`p-2 border-4 ${activeTab === 'income' ? 'border-black bg-white text-green-600' : 'border-gray-300 bg-white text-gray-400'}`}>
                        <Icons.TrendingUp size={24} strokeWidth={3} />
                    </span>
                    Pemasukan
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Daftar Kategori */}
                <div className={`lg:col-span-1 border-4 border-black p-4 ${activeSettingsWallet === 'asrama' ? 'bg-indigo-50' : activeTab === 'income' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black uppercase tracking-widest bg-black text-white px-3 py-1 inline-block text-xs">
                            {walletInfo.label} — {activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </h3>
                        <button
                            onClick={() => setIsCreatingNew(!isCreatingNew)}
                            className="bg-white border-2 border-black p-1 hover:bg-black hover:text-white transition-colors"
                        >
                            <Icons.Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={Object.keys(localCategories)}
                                strategy={verticalListSortingStrategy}
                            >
                                {Object.keys(localCategories).map((cat) => (
                                    <SortableCategoryItem
                                        key={cat}
                                        id={cat}
                                        cat={cat}
                                        categoryData={localCategories[cat]}
                                        isEditing={editingCategory === cat}
                                        onEdit={setEditingCategory}
                                        onDelete={handleDeleteCategory}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                {/* Kolom Kanan: Editor */}
                <div className="lg:col-span-2 border-4 border-black p-4 md:p-6 bg-white">
                    {isCreatingNew ? (
                        <div>
                            <h3 className={`font-black uppercase tracking-widest border-2 border-black text-black px-3 py-1 inline-block mb-6 ${activeSettingsWallet === 'asrama' ? 'bg-indigo-300' : activeTab === 'income' ? 'bg-green-300' : 'bg-blue-400'}`}>
                                Bikin Kategori Baru — {walletInfo.label}
                            </h3>
                            <form onSubmit={handleCreateNewCategory} className="space-y-6">
                                <div>
                                    <label className="block font-bold uppercase text-xs mb-2">Nama Kategori</label>
                                    <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                                        className="w-full border-4 border-black p-3 font-bold uppercase focus:outline-none focus:bg-yellow-50"
                                        placeholder="Cth: Kategori Baru" required />
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-xs mb-2">Warna</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableColors.map(color => (
                                            <button key={color} type="button" onClick={() => setNewCatColor(color)}
                                                className={`w-8 h-8 md:w-10 md:h-10 border-4 ${newCatColor === color ? 'border-black scale-110' : 'border-transparent'} ${color} hover:border-black transition-all`} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-xs mb-2">Ikon</label>
                                    <div className="grid grid-cols-6 md:grid-cols-10 gap-2 h-40 overflow-y-auto p-2 border-4 border-black bg-gray-50">
                                        {COMMON_ICONS.map(iconName => (
                                            <button key={iconName} type="button" onClick={() => setNewCatIcon(iconName)}
                                                className={`p-2 flex justify-center items-center border-2 ${newCatIcon === iconName ? 'border-black bg-yellow-400' : 'border-transparent hover:border-gray-300'}`}>
                                                <CategoryIcon iconName={iconName} size={24} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-black text-white font-black uppercase py-4 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors pop-shadow-sm">
                                    Tambah Kategori
                                </button>
                            </form>
                        </div>
                    ) : editingCategory ? (
                        <div>
                            <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
                                <div className={`p-4 border-4 border-black ${getCategoryColor(localCategories[editingCategory].color)} pop-shadow-sm`}>
                                    <CategoryIcon iconName={localCategories[editingCategory].icon} size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-wide">{editingCategory}</h3>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 border-2 border-black ${activeSettingsWallet === 'asrama' ? 'bg-indigo-200' : activeTab === 'income' ? 'bg-green-200' : 'bg-red-200'}`}>
                                        {walletInfo.label} — {activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block font-bold uppercase text-xs mb-2 bg-black text-white inline-block px-2 py-1">Ganti Warna</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableColors.map(color => (
                                                <button key={color} type="button" onClick={() => handleUpdateCategoryAppearance(null, color)}
                                                    className={`w-6 h-6 border-2 ${localCategories[editingCategory].color === color ? 'border-black scale-125' : 'border-transparent'} ${color} hover:border-black transition-all`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold uppercase text-xs mb-2 bg-black text-white inline-block px-2 py-1">Ganti Ikon</label>
                                        <div className="grid grid-cols-5 gap-2 h-32 overflow-y-auto p-2 border-4 border-black bg-gray-50">
                                            {COMMON_ICONS.map(iconName => (
                                                <button key={iconName} type="button" onClick={() => handleUpdateCategoryAppearance(iconName, null)}
                                                    className={`p-2 flex justify-center items-center border-2 ${localCategories[editingCategory].icon === iconName ? 'border-black bg-yellow-400' : 'border-transparent hover:border-gray-300'}`}>
                                                    <CategoryIcon iconName={iconName} size={20} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold uppercase text-xs mb-4 bg-black text-white inline-block px-2 py-1">Sub-Kategori</label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {localCategories[editingCategory].subCategories.map(sub => (
                                            <div key={sub} className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1 pr-1 font-bold uppercase text-sm">
                                                <span>{sub}</span>
                                                <button onClick={() => handleDeleteSubCategory(sub)} className="p-1 hover:bg-black hover:text-white transition-colors border-l-2 border-transparent hover:border-black">
                                                    <Icons.X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleAddSubCategory} className="flex gap-2">
                                        <input type="text" value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)}
                                            className="flex-1 border-4 border-black p-2 font-bold focus:outline-none focus:bg-yellow-50" placeholder="Sub-kategori baru..." />
                                        <button type="submit" className="bg-black text-white font-black uppercase px-4 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors">
                                            Tambah
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                            <Icons.Settings size={64} className="mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-widest">Pilih kategori di samping untuk mulai mengedit, atau klik + untuk bikin baru.</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Hapus Kategori?"
                message={`Yakin mau hapus kategori "${confirmModal.catName}" beserta isinya?`}
                onConfirm={confirmDeleteCategory}
                onCancel={() => setConfirmModal({ isOpen: false, catName: null })}
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                message={alertModal.message}
                onClose={() => setAlertModal({ isOpen: false, message: '' })}
            />

            <ConfirmModal
                isOpen={switchTarget !== null}
                title="PERINGATAN!"
                message="Ada editan yang belum divalidasi dan disimpan. Kalo pindah dompet atau mode, editan ini bakal HANGUS!"
                cancelText="KEMBALI KE EDITOR"
                confirmText="YAKIN PINDAH"
                onCancel={() => setSwitchTarget(null)}
                onConfirm={() => executeSwitch(switchTarget.type, switchTarget.value)}
            />
        </div>
    );
};

export default Settings;
