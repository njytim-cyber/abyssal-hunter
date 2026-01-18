import { memo, useCallback, useState, useEffect } from 'react';

import { shopManager } from '../game/ShopManager';
import type { ShopItem } from '../game/ShopTypes';
import { getItemEffectValue } from '../game/ShopTypes';

interface ShopScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface ShopItemDisplayProps {
  item: ShopItem & { currentLevel: number; nextCost: number; maxed: boolean };
  coins: number;
  onPurchase: (itemId: string) => void;
}

/**
 * Individual shop item card
 */
const ShopItemCard = memo(function ShopItemCard({ item, coins, onPurchase }: ShopItemDisplayProps) {
  const canAfford = coins >= item.nextCost && !item.maxed;
  const effectValue = getItemEffectValue(item, item.currentLevel + 1);
  const currentEffectValue = getItemEffectValue(item, item.currentLevel);

  // Format effect display based on type
  const formatEffect = (value: number, type: string): string => {
    const percentage = Math.round(value * 100);
    switch (type) {
      case 'speed':
        return `+${percentage}% Speed`;
      case 'dash':
        return `-${percentage}% Dash Cost`;
      case 'xp':
        return `+${percentage}% XP`;
      case 'size':
        return `+${percentage}% Start Size`;
      case 'vision':
        return `+${percentage}% Vision`;
      default:
        return `+${percentage}%`;
    }
  };

  return (
    <div className={`shop-item ${item.maxed ? 'maxed' : ''}`}>
      <div className="shop-item-icon">{item.icon}</div>
      <div className="shop-item-info">
        <h3 className="shop-item-name">{item.name}</h3>
        <p className="shop-item-desc">{item.description}</p>
        <div className="shop-item-stats">
          <div className="shop-item-level">
            Level: {item.currentLevel}/{item.maxLevel}
          </div>
          {item.currentLevel > 0 && (
            <div className="shop-item-current">
              Current: {formatEffect(currentEffectValue, item.effect.type)}
            </div>
          )}
          {!item.maxed && (
            <div className="shop-item-next">
              Next: {formatEffect(effectValue, item.effect.type)}
            </div>
          )}
        </div>
      </div>
      <div className="shop-item-action">
        {item.maxed ? (
          <div className="shop-item-maxed">MAX</div>
        ) : (
          <>
            <div className="shop-item-cost">
              <span className="coin-icon">🪙</span> {item.nextCost}
            </div>
            <button
              className="shop-item-buy"
              onClick={() => onPurchase(item.id)}
              disabled={!canAfford}
            >
              {canAfford ? 'Upgrade' : 'Not Enough'}
            </button>
          </>
        )}
      </div>
    </div>
  );
});

/**
 * Shop screen overlay for purchasing permanent upgrades
 */
export const ShopScreen = memo(function ShopScreen({ visible, onClose }: ShopScreenProps) {
  const [coins, setCoins] = useState(0);
  const [shopItems, setShopItems] = useState<
    Array<ShopItem & { currentLevel: number; nextCost: number; maxed: boolean }>
  >([]);

  // Load shop data
  const refreshShop = useCallback(() => {
    setCoins(shopManager.getCoins());
    setShopItems(shopManager.getShopItems());
  }, []);

  // Refresh when visible
  useEffect(() => {
    if (visible) {
      refreshShop();
    }
  }, [visible, refreshShop]);

  const handlePurchase = useCallback(
    (itemId: string) => {
      const success = shopManager.purchaseUpgrade(itemId);
      if (success) {
        // Refresh shop data after purchase
        refreshShop();
      }
    },
    [refreshShop]
  );

  if (!visible) return null;

  return (
    <div className="screen visible shop-screen">
      <div className="shop-container">
        <div className="shop-header">
          <h2 className="title">Abyssal Shop</h2>
          <div className="shop-balance">
            <span className="coin-icon">🪙</span>
            <span className="coin-amount">{coins}</span>
          </div>
        </div>

        <p className="shop-subtitle">Permanent upgrades to aid your hunt</p>

        <div className="shop-items">
          {shopItems.map(item => (
            <ShopItemCard key={item.id} item={item} coins={coins} onPurchase={handlePurchase} />
          ))}
        </div>

        <button className="shop-close" onClick={onClose}>
          Back to Depths
        </button>
      </div>
    </div>
  );
});
