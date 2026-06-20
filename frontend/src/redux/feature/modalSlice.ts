// redux/feature/modalSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  isReservationModalOpen: boolean;
  reservationId: string | null;
}

const initialState: ModalState = {
  isReservationModalOpen: false,
  reservationId: null,
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openReservationModal: (state, action: PayloadAction<string>) => {
      state.isReservationModalOpen = true;
      state.reservationId = action.payload;
    },
    closeReservationModal: (state) => {
      state.isReservationModalOpen = false;
      state.reservationId = null;
    },
  },
});

export const { openReservationModal, closeReservationModal } = modalSlice.actions;
export default modalSlice.reducer;