import React, { useState, useEffect } from 'react';
import { inventoryService, Item, ItemType, ItemRarity } from '../services/inventoryService';

interface InventoryPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ isVisible, onToggle }) => {
  const [inventory, setInventory] = useState(inventoryService.getInventory());
  const [equippedItems, setEquippedItems] = useState(inventoryService.getEquippedItems());
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'rarity' | 'value' | 'weight'>('name');
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');

  useEffect(() => {
    if (isVisible) {
      refreshInventory();
    }
  }, [isVisible]);
  const refreshInventory = () => {
    setInventory(inventoryService.getInventory());
    setEquippedItems(inventoryService.getEquippedItems());
  };

  // Helper functions to get equipped items by type
  const getEquippedItemByType = (type: ItemType): Item | null => {
    return equippedItems.find(item => item.type === type) || null;
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };
  const handleEquipItem = (item: Item) => {
    if (item.equippable) {
      const result = inventoryService.equipItem(item.id);
      if (result) {
        refreshInventory();
        setSelectedItem(null);
      }
    }
  };

  const handleUnequipItem = (item: Item) => {
    const result = inventoryService.unequipItem(item.id);
    if (result) {
      refreshInventory();
      setSelectedItem(null);
    }
  };

  const handleUseItem = (item: Item) => {
    if (item.usable) {
      const result = inventoryService.useItem(item.id);
      if (result) {
        refreshInventory();
        setSelectedItem(null);
      }
    }
  };

  const handleDropItem = (item: Item) => {
    const result = inventoryService.removeItem(item.id, 1);
    if (result) {
      refreshInventory();
      setSelectedItem(null);
    }
  };

  const handleSort = () => {
    inventoryService.sortInventory(sortBy);
    refreshInventory();
  };

  const getRarityColor = (rarity: ItemRarity): string => {
    const colors = {
      [ItemRarity.COMMON]: 'text-gray-400',
      [ItemRarity.UNCOMMON]: 'text-green-400',
      [ItemRarity.RARE]: 'text-blue-400',
      [ItemRarity.EPIC]: 'text-purple-400',
      [ItemRarity.LEGENDARY]: 'text-yellow-400'
    };
    return colors[rarity];
  };

  const getTypeIcon = (type: ItemType): string => {
    const icons = {
      [ItemType.WEAPON]: '⚔️',
      [ItemType.ARMOR]: '🛡️',
      [ItemType.CYBERWARE]: '🧠',
      [ItemType.CONSUMABLE]: '💉',
      [ItemType.TOOL]: '🔧',
      [ItemType.DATA]: '💾',
      [ItemType.MISC]: '📦'
    };
    return icons[type];
  };

  const filteredInventory = inventory.filter(slot => {
    if (!slot.item) return false;
    if (filterType === 'all') return true;
    return slot.item.type === filterType;
  });

  // Calculate inventory stats directly
  const totalWeight = inventoryService.getTotalWeight();
  const currentCapacity = inventoryService.getCurrentCapacity();
  const maxWeight = inventoryService.getMaxWeight();
  const maxSlots = inventoryService.getMaxSlots();
  const totalValue = inventoryService.getTotalValue();
  
  const inventoryStats = {
    usedSlots: currentCapacity,
    totalSlots: maxSlots,
    totalWeight: totalWeight,
    maxWeight: maxWeight,
    totalValue: totalValue
  };
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg w-full max-w-6xl h-full max-h-screen m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-cyan-400 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <h2 className="text-cyan-400 font-bold text-xl">INVENTORY SYSTEM v2.1</h2>
            <div className="text-xs text-gray-400">
              Slots: {inventoryStats.usedSlots}/{inventoryStats.totalSlots} | 
              Weight: {inventoryStats.totalWeight.toFixed(1)}/{inventoryStats.maxWeight}kg
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-cyan-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex h-full">
          {/* Left Panel - Inventory Grid */}
          <div className="flex-1 p-4">
            {/* Controls */}
            <div className="mb-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-cyan-400 text-xs">SORT:</label>                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-800 text-cyan-400 border border-gray-600 rounded px-2 py-1 text-xs"
                  aria-label="Sort inventory by"
                >
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                  <option value="rarity">Rarity</option>
                  <option value="value">Value</option>
                  <option value="weight">Weight</option>
                </select>
                <button
                  onClick={handleSort}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded text-xs"
                >
                  SORT
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-cyan-400 text-xs">FILTER:</label>                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-gray-800 text-cyan-400 border border-gray-600 rounded px-2 py-1 text-xs"
                  aria-label="Filter inventory by type"
                >
                  <option value="all">All Items</option>
                  <option value={ItemType.WEAPON}>Weapons</option>
                  <option value={ItemType.ARMOR}>Armor</option>
                  <option value={ItemType.CYBERWARE}>Cyberware</option>
                  <option value={ItemType.CONSUMABLE}>Consumables</option>
                  <option value={ItemType.TOOL}>Tools</option>
                  <option value={ItemType.DATA}>Data</option>
                  <option value={ItemType.MISC}>Misc</option>
                </select>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-8 gap-2 h-full overflow-y-auto">
              {filteredInventory.map((slot, index) => (
                <div
                  key={index}
                  onClick={() => slot.item && handleItemClick(slot.item)}
                  className={`
                    border-2 rounded p-2 cursor-pointer transition-all h-20 flex flex-col items-center justify-center
                    ${slot.item ? 'border-cyan-400 hover:border-yellow-400 bg-gray-800' : 'border-gray-600 bg-gray-900'}
                    ${selectedItem?.id === slot.item?.id ? 'border-yellow-400 bg-yellow-900 bg-opacity-20' : ''}
                  `}
                >
                  {slot.item ? (
                    <>
                      <div className="text-lg">{getTypeIcon(slot.item.type)}</div>
                      <div className={`text-xs ${getRarityColor(slot.item.rarity)} text-center`}>
                        {slot.item.name.substring(0, 8)}
                      </div>
                      {slot.quantity > 1 && (
                        <div className="text-xs text-yellow-400">x{slot.quantity}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 text-xs">Empty</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center Panel - Equipment Slots */}
          <div className="w-64 border-l border-cyan-400 p-4 bg-gray-800">
            <h3 className="text-cyan-400 font-bold mb-4 text-center">EQUIPPED</h3>
            
            <div className="space-y-3">              {/* Weapon Slot */}
              <div className="border border-gray-600 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">WEAPON</div>
                {getEquippedItemByType(ItemType.WEAPON) ? (
                  <div
                    onClick={() => handleItemClick(getEquippedItemByType(ItemType.WEAPON)!)}
                    className="flex items-center space-x-2 cursor-pointer hover:text-yellow-400"
                  >
                    <span>{getTypeIcon(getEquippedItemByType(ItemType.WEAPON)!.type)}</span>
                    <span className={`text-xs ${getRarityColor(getEquippedItemByType(ItemType.WEAPON)!.rarity)}`}>
                      {getEquippedItemByType(ItemType.WEAPON)!.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs italic">No weapon equipped</div>
                )}
              </div>

              {/* Armor Slot */}
              <div className="border border-gray-600 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">ARMOR</div>
                {getEquippedItemByType(ItemType.ARMOR) ? (
                  <div
                    onClick={() => handleItemClick(getEquippedItemByType(ItemType.ARMOR)!)}
                    className="flex items-center space-x-2 cursor-pointer hover:text-yellow-400"
                  >
                    <span>{getTypeIcon(getEquippedItemByType(ItemType.ARMOR)!.type)}</span>
                    <span className={`text-xs ${getRarityColor(getEquippedItemByType(ItemType.ARMOR)!.rarity)}`}>
                      {getEquippedItemByType(ItemType.ARMOR)!.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs italic">No armor equipped</div>
                )}
              </div>

              {/* Cyberware Slot */}
              <div className="border border-gray-600 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">CYBERWARE</div>
                {getEquippedItemByType(ItemType.CYBERWARE) ? (
                  <div
                    onClick={() => handleItemClick(getEquippedItemByType(ItemType.CYBERWARE)!)}
                    className="flex items-center space-x-2 cursor-pointer hover:text-yellow-400"
                  >
                    <span>{getTypeIcon(getEquippedItemByType(ItemType.CYBERWARE)!.type)}</span>
                    <span className={`text-xs ${getRarityColor(getEquippedItemByType(ItemType.CYBERWARE)!.rarity)}`}>
                      {getEquippedItemByType(ItemType.CYBERWARE)!.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs italic">No cyberware equipped</div>
                )}
              </div>
            </div>

            {/* Stats Display */}
            <div className="mt-6 border-t border-gray-600 pt-4">
              <h4 className="text-cyan-400 text-sm font-bold mb-2">INVENTORY STATS</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Used Slots:</span>
                  <span className="text-cyan-400">{inventoryStats.usedSlots}/{inventoryStats.totalSlots}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Weight:</span>
                  <span className="text-cyan-400">{inventoryStats.totalWeight.toFixed(1)}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-yellow-400">{inventoryStats.totalValue} €$</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Item Details */}
          <div className="w-80 border-l border-cyan-400 p-4">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="border-b border-gray-600 pb-4">
                  <h3 className={`font-bold text-lg ${getRarityColor(selectedItem.rarity)}`}>
                    {selectedItem.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg">{getTypeIcon(selectedItem.type)}</span>
                    <span className="text-xs text-gray-400 uppercase">{selectedItem.type}</span>
                    <span className={`text-xs uppercase ${getRarityColor(selectedItem.rarity)}`}>
                      {selectedItem.rarity}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-300">
                  {selectedItem.description}
                </div>

                {/* Stats */}
                {selectedItem.stats && (
                  <div className="border border-gray-600 rounded p-3">
                    <h4 className="text-cyan-400 font-bold text-sm mb-2">STATS</h4>
                    <div className="space-y-1 text-xs">
                      {selectedItem.stats.damage && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Damage:</span>
                          <span className="text-red-400">+{selectedItem.stats.damage}</span>
                        </div>
                      )}
                      {selectedItem.stats.defense && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Defense:</span>
                          <span className="text-blue-400">+{selectedItem.stats.defense}</span>
                        </div>
                      )}
                      {selectedItem.stats.hackingBonus && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Hacking:</span>
                          <span className="text-purple-400">+{selectedItem.stats.hackingBonus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Item Properties */}
                <div className="border border-gray-600 rounded p-3">
                  <h4 className="text-cyan-400 font-bold text-sm mb-2">PROPERTIES</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Value:</span>
                      <span className="text-yellow-400">{selectedItem.value} €$</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weight:</span>
                      <span className="text-cyan-400">{selectedItem.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usable:</span>
                      <span className={selectedItem.usable ? 'text-green-400' : 'text-red-400'}>
                        {selectedItem.usable ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Equippable:</span>
                      <span className={selectedItem.equippable ? 'text-green-400' : 'text-red-400'}>
                        {selectedItem.equippable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {selectedItem.equippable && (
                    <button                      onClick={() => {
                        const isEquipped = equippedItems.some(item => item.id === selectedItem.id);
                        if (isEquipped) {
                          handleUnequipItem(selectedItem);
                        } else {
                          handleEquipItem(selectedItem);
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded text-sm"
                    >
                      {equippedItems.some(item => item.id === selectedItem.id) ? 'UNEQUIP' : 'EQUIP'}
                    </button>
                  )}

                  {selectedItem.usable && (
                    <button
                      onClick={() => handleUseItem(selectedItem)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded text-sm"
                    >
                      USE
                    </button>
                  )}

                  <button
                    onClick={() => handleDropItem(selectedItem)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded text-sm"
                  >
                    DROP
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <div className="text-sm">Select an item to view details</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
