export type WageRow = {
  label: string;
  packs: number;
  amount: number;
};

export type CatalogCard = {
  id: string;
  title: string;
  image: string;
  note: string;
  wages: WageRow[];
};

export type ChoiceItem = {
  productId: string;
  title: string;
  quantity: number;
  label: string;
};

export const maxChoices = 3;
