// Delivery service providers configuration
export const DELIVERY_PROVIDERS = {
  express: [
    { 
      id: "uber", 
      name: "Uber Courier", 
      price: 1500, 
      logo: "https://logos-world.net/wp-content/uploads/2020/05/Uber-Logo.png" 
    },
    { 
      id: "bolt", 
      name: "Bolt Send", 
      price: 1000, 
      logo: "https://i.pinimg.com/1200x/3c/71/2e/3c712e9562118c07f207e9d3fe1b6026.jpg" 
    },
  ],
  standard: [
    { 
      id: "dhl", 
      name: "DHL", 
      price: 0, 
      logo: "https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg" 
    },
    { 
      id: "fargo", 
      name: "Fargo Courier", 
      price: 0, 
      logo: "https://www.fargocourier.co.ke/wp-content/uploads/2024/02/fargo-courier-logo.png" 
    },
    { 
      id: "g4s", 
      name: "G4S Courier", 
      price: 0, 
      logo: "https://i.pinimg.com/1200x/33/bd/01/33bd01f167372a44c08d47709f4219e6.jpg" 
    },
  ],
};

export const DELIVERY_TYPES = {
  HOME: "home",
  COLLECTION: "collection",
  CLICK_COLLECT: "click_collect",
};

