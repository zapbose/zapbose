import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import settingService from 'services/settings';
import informationService from 'services/rest/information';

const initialState = {
  loading: false,
  settings: {},
  error: '',
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  (params = {}) => {
    return settingService
      .get({ ...initialState.params, ...params })
      .then((res) => res);
  },
);
export const fetchRestSettings = createAsyncThunk(
  'settings/fetchRestSettings',
  (params = {}) => {
    return informationService
      .settingsInfo({ ...initialState.params, ...params })
      .then((res) => res);
  },
);

const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettingsSync(state, action) {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // admin settings
    builder.addCase(fetchSettings.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSettings.fulfilled, (state, action) => {
      const { payload } = action;
      state.loading = false;
      state.settings = createSettings(payload.data);
      state.error = '';
    });
    builder.addCase(fetchSettings.rejected, (state, action) => {
      state.loading = false;
      state.settings = {};
      state.error = action.error.message;
    });

    // rest settings
    builder.addCase(fetchRestSettings.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchRestSettings.fulfilled, (state, action) => {
      const { payload } = action;
      state.loading = false;
      state.settings = createSettings(payload.data);
      state.error = '';
    });
    builder.addCase(fetchRestSettings.rejected, (state, action) => {
      state.loading = false;
      state.settings = {};
      state.error = action.error.message;
    });
  },
});

function createSettings(list) {
  const result = list.map((item) => ({
    [item.key]: item.value,
  }));
  return Object.assign({}, ...result);
}

export const { updateSettingsSync } = settingSlice.actions;

export default settingSlice.reducer;
