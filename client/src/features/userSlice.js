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
  async (token) => {
    try {
      const { data } = await api.get("/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data.success) {
        return {
          connections: [],
          following: [],
        };
      }

      return {
        ...data.user,
        connections: data.user.connections || [],
        following: data.user.following || [],
      };
    } catch (error) {
      console.log(error);
      return {
        connections: [],
        following: [],
      };
    }
  }
);

export const updateUser = createAsyncThunk(
  "user/update",
  async ({ userData, token }) => {
    const { data } = await api.post("/api/user/update", userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (data.success) {
      return {
        ...data.user,
        connections: data.user.connections || [],
        following: data.user.following || [],
      };
    } else {
      toast.error(data.message);
      return {
        connections: [],
        following: [],
      };
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