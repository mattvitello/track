export const StarRating = (props: { rating: number }) => { 
  const { rating } = props;
  const filledStars = Math.floor(rating);
  const halfStar = Math.round(rating - filledStars);

  const starIcons = [];

  for (let i = 0; i < filledStars; i++) {
    starIcons.push(
      <i key={i}>★</i>
    );
  }

  if (halfStar) {
    starIcons.push(
      <i key="half">½</i>
    );
  }

  return <>{starIcons}</>;
};
