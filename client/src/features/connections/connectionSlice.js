import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    connections : [],
    pendingConnections : [],
    followers: [],
     following: []

}

const connectionsSlice = createSlice({
    name:'connections',
    initialState,
    reducer:{

    }
})

export default connectionsSlice.reducer;