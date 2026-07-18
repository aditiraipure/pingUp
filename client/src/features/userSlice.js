import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const initialState = {
  value: {
    connections: [],
    following: [],
  },
};

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (token, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data.success) {
        return rejectWithValue(data.message || "Unable to load user profile");
      }

      return {
        ...data.user,
        connections: data.user.connections || [],
        following: data.user.following || [],
      };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  "user/update",
  async ({ userData, token }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/user/update", userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data.success) {
        toast.error(data.message);
        return rejectWithValue(data.message || "Unable to update profile");
      }
      return {
        ...data.user,
        connections: data.user.connections || [],
        following: data.user.following || [],
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(fetchUser.fulfilled, (state, action) => {
      state.value = action.payload;
    });

    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.value = action.payload;
    });
  },
});

export default userSlice.reducer;
