package game

func applyQuestProgress(user *User, event string, amount int) {
	for _, quest := range user.Quests {
		if quest.Claimed {
			continue
		}
		switch quest.ID {
		case "daily-import":
			if event == "import" {
				quest.CurrentCount = min(quest.TargetCount, quest.CurrentCount+amount)
			}
		case "daily-collect":
			if event == "collect" {
				quest.CurrentCount = min(quest.TargetCount, quest.CurrentCount+amount)
			}
		case "main-upgrade":
			if event == "upgrade" {
				quest.CurrentCount = min(quest.TargetCount, quest.CurrentCount+amount)
			}
		}
	}
}

func recalculateLevel(user *User) {
	for user.CurrentXP >= user.MaxXP {
		user.CurrentXP -= user.MaxXP
		user.Level++
		user.MaxXP += 50
	}
}

func fastSellPrice(product Product) int64 {
	return product.SellPrice * 6 / 10
}
