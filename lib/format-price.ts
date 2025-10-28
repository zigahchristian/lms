const formatPrice = (price: number): string => {
  const formatted = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(price);

  return formatted;
};

export default formatPrice;
