import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
        loading: true,
        // Convenience selectors — kept in sync with userData
        role: null,     // 'SUPER_ADMIN' | 'RECRUITER' | 'USER'
        orgId: null,    // number | null
        // Impersonation banner support
        isImpersonating: false,
        impersonatedAs: null,
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload;
            state.loading = false;
            if (action.payload) {
                state.role  = action.payload.role  || 'USER';
                state.orgId = action.payload.org_id ?? null;
            } else {
                state.role  = null;
                state.orgId = null;
                state.isImpersonating = false;
                state.impersonatedAs  = null;
            }
        },
        setImpersonating: (state, action) => {
            // { isImpersonating: bool, impersonatedAs: { id, name, email, role } | null }
            state.isImpersonating = action.payload.isImpersonating;
            state.impersonatedAs  = action.payload.impersonatedAs || null;
        },
        clearImpersonation: (state) => {
            state.isImpersonating = false;
            state.impersonatedAs  = null;
        },
    },
});

export const { setUserData, setImpersonating, clearImpersonation } = userSlice.actions;
export default userSlice.reducer;