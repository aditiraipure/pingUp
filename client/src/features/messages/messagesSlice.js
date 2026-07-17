import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

const initialState = {
  messages: [],
  typingByUser: {},
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
    resetMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      if (action.payload) {
        state.messages = action.payload.messages || []; 
      }
    });
  },
});

export const { setMessages, addMessage, replaceMessage, removeMessage, markMessageFailed, markMessagesSeen, setTyping, resetMessages } =
  messagesSlice.actions;

export default messagesSlice.reducer;
