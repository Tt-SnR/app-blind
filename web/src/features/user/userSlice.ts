// src/features/user/userSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./types";

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    fetchUsersRequest(state) {
      state.loading = true;
    },
    fetchUsersSuccess(state, action: PayloadAction<User[]>) {
      state.loading = false;
      state.users = action.payload;
    },
    fetchUsersFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchUsersRequest, fetchUsersSuccess, fetchUsersFailure } = userSlice.actions;
export default userSlice.reducer;
