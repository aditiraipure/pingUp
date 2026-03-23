import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    messages : []
}

const messagesSlice = createSlice({
    name:'messages',
    initialState,
    reducer:{

    }
})

export default messagesSlice.reducer;