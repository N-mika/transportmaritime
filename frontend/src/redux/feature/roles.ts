import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Role } from "../../data/type";

type RoleState = {
  list: Role[];
};


const initialState: RoleState = {
  list: [],
};

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    setRoles: (state, action: PayloadAction<Role[]>) => {
      state.list = action.payload;
    },
    addRole: (state, action: PayloadAction<Role>) => {
      const role = action.payload;
      if (!state.list.find((r) => r.name === role.name)) {
        state.list.push(role);
      }
    },
    updateRole: (state, action: PayloadAction<Role>) => {
      const updated = action.payload;
      const index = state.list.findIndex((r) => r.id === updated.id);
      if (index !== -1) state.list[index] = updated;
    },
    removeRole: (state, action: PayloadAction<Role>) => {
      const role = action.payload;
      state.list = state.list.filter((r) => r.name !== role.name);
    },
  },
});

export const { setRoles, addRole, updateRole, removeRole } = rolesSlice.actions;
export default rolesSlice.reducer;

