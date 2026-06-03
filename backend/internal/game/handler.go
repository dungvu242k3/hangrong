package game

import (
	"errors"
	"net/http"
	"strings"

	"hangrong/backend/internal/shared"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /healthz", h.health)
	mux.HandleFunc("GET /readyz", h.health)
	mux.HandleFunc("GET /api/healthz", h.health)
	mux.HandleFunc("GET /api/readyz", h.health)

	mux.HandleFunc("POST /api/auth/register", h.register)
	mux.HandleFunc("POST /api/auth/login", h.login)
	mux.HandleFunc("POST /api/auth/refresh", h.refresh)

	mux.HandleFunc("GET /api/player/profile", h.withAuth(h.profile))
	mux.HandleFunc("GET /api/auth/me", h.withAuth(h.profile))
	mux.HandleFunc("GET /api/products", h.withAuth(h.products))
	mux.HandleFunc("GET /api/products/unlocked", h.withAuth(h.products))
	mux.HandleFunc("GET /api/import-orders", h.withAuth(h.importOrders))
	mux.HandleFunc("GET /api/import-orders/active", h.withAuth(h.importOrders))
	mux.HandleFunc("POST /api/import", h.withAuth(h.createImportOrder))
	mux.HandleFunc("POST /api/import-orders", h.withAuth(h.createImportOrder))
	mux.HandleFunc("POST /api/import-orders/{id}/claim", h.withAuth(h.claimImportOrder))
	mux.HandleFunc("GET /api/inventory", h.withAuth(h.inventory))
	mux.HandleFunc("POST /api/inventory/sell", h.withAuth(h.fastSell))
	mux.HandleFunc("POST /api/inventory/sell-to-system", h.withAuth(h.fastSell))
	mux.HandleFunc("GET /api/selling/slots", h.withAuth(h.slots))
	mux.HandleFunc("POST /api/selling/slots/{id}/place", h.withAuth(h.placeProduct))
	mux.HandleFunc("POST /api/selling/slots/{id}/collect", h.withAuth(h.collectSlot))
	mux.HandleFunc("POST /api/selling/sync", h.withAuth(h.slots))
	mux.HandleFunc("POST /api/stalls/upgrade", h.withAuth(h.upgradeStall))
	mux.HandleFunc("GET /api/quests", h.withAuth(h.quests))
	mux.HandleFunc("POST /api/quests/{id}/claim", h.withAuth(h.claimQuest))
	mux.HandleFunc("GET /api/friends", h.withAuth(h.friends))
	mux.HandleFunc("GET /api/neighbors/{id}", h.withAuth(h.neighborSlots))
	mux.HandleFunc("GET /api/neighbors/{id}/stall", h.withAuth(h.neighborSlots))
	mux.HandleFunc("POST /api/neighbors/{id}/help", h.withAuth(h.helpNeighbor))
	mux.HandleFunc("POST /api/neighbors/{id}/prank", h.withAuth(h.prankNeighbor))
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	shared.WriteJSON(w, r, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid JSON body.")
		return
	}

	tokens, err := h.service.Register(strings.TrimSpace(req.Username), strings.TrimSpace(req.Email), req.Password)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusCreated, tokens)
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid JSON body.")
		return
	}

	tokens, err := h.service.Login(strings.TrimSpace(req.Username), req.Password)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, tokens)
}

func (h *Handler) refresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid JSON body.")
		return
	}

	tokens, err := h.service.Refresh(req.RefreshToken)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, tokens)
}

func (h *Handler) profile(w http.ResponseWriter, r *http.Request, userID string) {
	profile, err := h.service.Profile(userID)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, profile)
}

func (h *Handler) products(w http.ResponseWriter, r *http.Request, userID string) {
	shared.WriteJSON(w, r, http.StatusOK, h.service.Products(userID))
}

func (h *Handler) importOrders(w http.ResponseWriter, r *http.Request, userID string) {
	orders, err := h.service.ImportOrders(userID)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, orders)
}

func (h *Handler) createImportOrder(w http.ResponseWriter, r *http.Request, userID string) {
	var req struct {
		ProductID string `json:"productId"`
		Quantity  int    `json:"quantity"`
	}
	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid JSON body.")
		return
	}

	order, newBalance, err := h.service.CreateImportOrder(userID, req.ProductID, req.Quantity)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusCreated, map[string]any{"order": order, "newBalance": newBalance})
}

func (h *Handler) claimImportOrder(w http.ResponseWriter, r *http.Request, userID string) {
	if err := h.service.ClaimImportOrder(userID, r.PathValue("id")); err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) inventory(w http.ResponseWriter, r *http.Request, userID string) {
	items, err := h.service.Inventory(userID)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, items)
}

func (h *Handler) fastSell(w http.ResponseWriter, r *http.Request, userID string) {
	var req struct {
		ProductID string `json:"productId"`
		Quantity  int    `json:"quantity"`
	}
	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid JSON body.")
		return
	}

	gained, err := h.service.FastSell(userID, req.ProductID, req.Quantity)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]any{"success": true, "gainedCoins": gained})
}

func (h *Handler) slots(w http.ResponseWriter, r *http.Request, userID string) {
	slots, err := h.service.Slots(userID)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, slots)
}

func (h *Handler) placeProduct(w http.ResponseWriter, r *http.Request, userID string) {
	var req struct {
		ProductID string `json:"productId"`
	}
	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid JSON body.")
		return
	}

	slot, err := h.service.PlaceProduct(userID, r.PathValue("id"), req.ProductID)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]any{"slot": slot})
}

func (h *Handler) collectSlot(w http.ResponseWriter, r *http.Request, userID string) {
	reward, newBalance, err := h.service.CollectSlot(userID, r.PathValue("id"))
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]any{"success": true, "coinsReward": reward, "newBalance": newBalance})
}

func (h *Handler) upgradeStall(w http.ResponseWriter, r *http.Request, userID string) {
	newLevel, cost, err := h.service.UpgradeStall(userID)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]any{"success": true, "newLevel": newLevel, "upgradeCost": cost})
}

func (h *Handler) quests(w http.ResponseWriter, r *http.Request, userID string) {
	quests, err := h.service.Quests(userID)
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, quests)
}

func (h *Handler) claimQuest(w http.ResponseWriter, r *http.Request, userID string) {
	coins, gems, err := h.service.ClaimQuest(userID, r.PathValue("id"))
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]any{"success": true, "coinsReward": coins, "gemsReward": gems})
}

func (h *Handler) friends(w http.ResponseWriter, r *http.Request, userID string) {
	shared.WriteJSON(w, r, http.StatusOK, h.service.Friends())
}

func (h *Handler) neighborSlots(w http.ResponseWriter, r *http.Request, userID string) {
	slots, err := h.service.NeighborSlots(r.PathValue("id"))
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, slots)
}

func (h *Handler) helpNeighbor(w http.ResponseWriter, r *http.Request, userID string) {
	xp, err := h.service.NeighborAction(userID, r.PathValue("id"), "help")
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]any{"success": true, "gainedXp": xp})
}

func (h *Handler) prankNeighbor(w http.ResponseWriter, r *http.Request, userID string) {
	xp, err := h.service.NeighborAction(userID, r.PathValue("id"), "prank")
	if err != nil {
		h.writeServiceError(w, r, err)
		return
	}
	shared.WriteJSON(w, r, http.StatusOK, map[string]any{"success": true, "gainedXp": xp})
}

func (h *Handler) withAuth(next func(http.ResponseWriter, *http.Request, string)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if len(header) > 4096 {
			shared.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header.")
			return
		}
		token, ok := strings.CutPrefix(header, "Bearer ")
		if !ok || token == "" {
			shared.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Missing access token.")
			return
		}

		userID, ok := h.service.UserIDForAccessToken(token)
		if !ok {
			shared.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired access token.")
			return
		}
		next(w, r, userID)
	}
}

func (h *Handler) writeServiceError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		shared.WriteError(w, r, http.StatusBadRequest, "VALIDATION_ERROR", "Request payload is not valid.")
	case errors.Is(err, ErrUnauthorized):
		shared.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid credentials or session.")
	case errors.Is(err, ErrForbidden):
		shared.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "You do not have permission for this action.")
	case errors.Is(err, ErrNotFound):
		shared.WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "Resource not found.")
	case errors.Is(err, ErrConflict):
		shared.WriteError(w, r, http.StatusConflict, "CONFLICT", "Action conflicts with current state.")
	case errors.Is(err, ErrInsufficientCoins):
		shared.WriteError(w, r, http.StatusBadRequest, "INSUFFICIENT_COINS", "Not enough coins.")
	case errors.Is(err, ErrInsufficientStock):
		shared.WriteError(w, r, http.StatusBadRequest, "INVENTORY_NOT_ENOUGH", "Not enough inventory.")
	case errors.Is(err, ErrNotReady):
		shared.WriteError(w, r, http.StatusBadRequest, "NOT_READY", "This action is not ready yet.")
	default:
		shared.WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Unexpected server error.")
	}
}
