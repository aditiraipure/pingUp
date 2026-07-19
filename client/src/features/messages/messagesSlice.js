import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

const initialState = {
  messages: [],
  typingByUser: {},
  unreadCount: 0,
  unreadByUser: {},
};

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ token, userId }) => {
    const { data } = await api.post(
      "/api/message/get",
      { to_user_id: userId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data.success ? data : null;
  }
);

export const fetchUnreadMessageCounts = createAsyncThunk(
  "messages/fetchUnreadCounts",
  async (token, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/message/unread", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) return rejectWithValue(data.message);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      if (!state.messages.some((message) => message._id === action.payload._id)) state.messages.push(action.payload);
    },
    replaceMessage: (state, action) => {
      const index = state.messages.findIndex((message) => message._id === action.payload.tempId);
      if (index !== -1) state.messages[index] = action.payload.message;
      else state.messages.push(action.payload.message);
    },
    removeMessage: (state, action) => { state.messages = state.messages.filter((message) => message._id !== action.payload); },
    markMessageFailed: (state, action) => {
      const message = state.messages.find((item) => item._id === action.payload);
      if (message) message.delivery_status = "failed";
    },
    markMessagesSeen: (state, action) => {
      const ids = new Set(action.payload);
      state.messages.forEach((message) => { if (ids.has(message._id)) { message.is_seen = true; message.delivery_status = "seen"; } });
    },
    setTyping: (state, action) => { state.typingByUser[action.payload.userId] = action.payload.isTyping; },
    incrementUnread: (state, action) => {
      const userId = action.payload;
      state.unreadByUser[userId] = (state.unreadByUser[userId] || 0) + 1;
      state.unreadCount += 1;
    },
    markChatRead: (state, action) => {
      const userId = action.payload;
      const count = state.unreadByUser[userId] || 0;
      state.unreadCount = Math.max(0, state.unreadCount - count);
      delete state.unreadByUser[userId];
    },
    resetMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      if (action.payload) {
        state.messages = action.payload.messages || []; 
        const userId = action.meta.arg.userId;
        const count = state.unreadByUser[userId] || 0;
        state.unreadCount = Math.max(0, state.unreadCount - count);
        delete state.unreadByUser[userId];
      }
    })
      .addCase(fetchUnreadMessageCounts.fulfilled, (state, action) => {
        state.unreadCount = action.payload.total || 0;
        state.unreadByUser = action.payload.byUser || {};
      });
  },
});

export const { setMessages, addMessage, replaceMessage, removeMessage, markMessageFailed, markMessagesSeen, setTyping, incrementUnread, markChatRead, resetMessages } =
  messagesSlice.actions;

export default messagesSlice.reducer;
