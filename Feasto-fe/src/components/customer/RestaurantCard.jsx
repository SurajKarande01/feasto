
const RestaurantCard = ({ restaurant }) => (
	<div className="restaurant-card">{restaurant?.name ?? 'Restaurant'}</div>
);

export default RestaurantCard;

 
