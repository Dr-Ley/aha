import { create } from 'zustand';
import { DELIVERY_TYPES } from '../constants/deliveryProviders';

const useDeliveryStore = create((set, get) => ({
  // Selected delivery option
  selectedType: null,
  
  // Home delivery state
  homeDelivery: {
    formData: {
      firstName: '',
      lastName: '',
      address: '',
      apartment: '',
      postcode: '',
      city: '',
      county: '',
      phone: '',
      email: '',
    },
    showApartment: false,
    selectedProvider: null,
    providerType: null, // 'express' or 'standard'
  },
  
  // Collection point state
  collectionPoint: {
    formData: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    },
    selectedLocation: null,
    searchQuery: '',
    searchResults: [],
  },
  
  // Click & Collect state
  clickCollect: {
    searchQuery: '',
    searchResults: [],
    selectedStores: {}, // { brandId: storeLocation }
  },
  
  // Actions
  setSelectedType: (type) => set({ selectedType: type }),
  
  // Home delivery actions
  updateHomeDeliveryForm: (field, value) => set((state) => ({
    homeDelivery: {
      ...state.homeDelivery,
      formData: {
        ...state.homeDelivery.formData,
        [field]: value,
      },
    },
  })),
  
  toggleApartmentField: () => set((state) => ({
    homeDelivery: {
      ...state.homeDelivery,
      showApartment: !state.homeDelivery.showApartment,
    },
  })),
  
  selectHomeDeliveryProvider: (providerId, providerType) => set((state) => ({
    homeDelivery: {
      ...state.homeDelivery,
      selectedProvider: providerId,
      providerType,
    },
  })),
  
  // Collection point actions
  updateCollectionForm: (field, value) => set((state) => ({
    collectionPoint: {
      ...state.collectionPoint,
      formData: {
        ...state.collectionPoint.formData,
        [field]: value,
      },
    },
  })),
  
  setCollectionSearchQuery: (query) => set((state) => ({
    collectionPoint: {
      ...state.collectionPoint,
      searchQuery: query,
    },
  })),
  
  setCollectionSearchResults: (results) => set((state) => ({
    collectionPoint: {
      ...state.collectionPoint,
      searchResults: results,
    },
  })),
  
  selectCollectionLocation: (location) => set((state) => ({
    collectionPoint: {
      ...state.collectionPoint,
      selectedLocation: location,
      searchQuery: '',
      searchResults: [],
    },
  })),
  
  // Click & Collect actions
  setClickCollectSearchQuery: (query) => set((state) => ({
    clickCollect: {
      ...state.clickCollect,
      searchQuery: query,
    },
  })),
  
  setClickCollectSearchResults: (results) => set((state) => ({
    clickCollect: {
      ...state.clickCollect,
      searchResults: results,
    },
  })),
  
  selectStoreForBrand: (brandId, store) => set((state) => ({
    clickCollect: {
      ...state.clickCollect,
      selectedStores: {
        ...state.clickCollect.selectedStores,
        [brandId]: store,
      },
      searchQuery: '',
      searchResults: [],
    },
  })),
  
  // Get delivery fee
  getDeliveryFee: () => {
    const state = get();
    if (state.selectedType === DELIVERY_TYPES.HOME && state.homeDelivery.selectedProvider) {
      const providers = require('../constants/deliveryProviders').DELIVERY_PROVIDERS;
      const providerList = state.homeDelivery.providerType === 'express' 
        ? providers.express 
        : providers.standard;
      const provider = providerList.find(p => p.id === state.homeDelivery.selectedProvider);
      return provider ? provider.price : 0;
    }
    return 0;
  },
  
  // Reset delivery selection
  resetDelivery: () => set({
    selectedType: null,
    homeDelivery: {
      formData: {
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        postcode: '',
        city: '',
        county: '',
        phone: '',
        email: '',
      },
      showApartment: false,
      selectedProvider: null,
      providerType: null,
    },
    collectionPoint: {
      formData: {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
      },
      selectedLocation: null,
      searchQuery: '',
      searchResults: [],
    },
    clickCollect: {
      searchQuery: '',
      searchResults: [],
      selectedStores: {},
    },
  }),
}));

export default useDeliveryStore;

