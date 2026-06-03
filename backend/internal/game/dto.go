package game

import "time"

func profileDTO(user *User) UserProfile {
	return UserProfile{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Coins:     user.Coins,
		Gems:      user.Gems,
		Level:     user.Level,
		CurrentXP: user.CurrentXP,
		MaxXP:     user.MaxXP,
	}
}

func importOrderDTO(order *OrderState, product Product, now time.Time) ImportOrder {
	remaining := max(0, int(order.CompletedAt.Sub(now).Seconds()))
	return ImportOrder{
		ID:            order.ID,
		ProductID:     order.ProductID,
		Name:          product.Name,
		Quantity:      order.Quantity,
		TimeRemaining: remaining,
		TotalTime:     max(1, int(order.CompletedAt.Sub(order.CreatedAt).Seconds())),
		Status:        orderStatus(order, now),
	}
}

func inventoryDTO(product Product, quantity int) InventoryItem {
	return InventoryItem{
		ID:            "inv-" + product.ID,
		ProductID:     product.ID,
		Name:          product.Name,
		Category:      product.Category,
		Quantity:      quantity,
		SellPrice:     product.SellPrice,
		FastSellPrice: fastSellPrice(product),
		IconName:      product.IconName,
		Color:         product.Color,
		Description:   "Ready to place on your stall.",
	}
}

func questDTO(quest *QuestState) Quest {
	return Quest{
		ID:           quest.ID,
		Title:        quest.Title,
		Description:  quest.Description,
		TargetCount:  quest.TargetCount,
		CurrentCount: min(quest.TargetCount, quest.CurrentCount),
		RewardCoins:  quest.RewardCoins,
		RewardGems:   quest.RewardGems,
		IsCompleted:  quest.CurrentCount >= quest.TargetCount,
		IsClaimed:    quest.Claimed,
		Type:         quest.Type,
	}
}
