package com.feasto.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.feasto.entity.Restaurant;
import com.feasto.util.DistanceUtil;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

@Repository
public class RestaurantRepositoryImpl implements RestaurantRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Page<Object[]> findNearbyWithDistance(double lat, double lon, Pageable pageable, String sort,
            double maxDistanceKm) {
        // Compute a bounding box for the provided search radius (maxDistanceKm). This
        // reduces DB rows scanned.
        // 1 degree latitude ~= 111 km
        double radiusKm = maxDistanceKm > 0 ? maxDistanceKm : 50.0; // use provided radius or default
        double latDelta = radiusKm / 111.0;
        double lonDelta = radiusKm / (111.320 * Math.cos(Math.toRadians(lat)));
        double minLat = lat - latDelta;
        double maxLat = lat + latDelta;
        double minLon = lon - lonDelta;
        double maxLon = lon + lonDelta;

        String jpql = "SELECT r FROM Restaurant r WHERE r.isActive = true AND r.address.latitude BETWEEN :minLat AND :maxLat AND r.address.longitude BETWEEN :minLon AND :maxLon";
        Query q = em.createQuery(jpql, Restaurant.class);
        q.setParameter("minLat", minLat);
        q.setParameter("maxLat", maxLat);
        q.setParameter("minLon", minLon);
        q.setParameter("maxLon", maxLon);
        @SuppressWarnings("unchecked")
        List<Restaurant> candidates = q.getResultList();

        // Compute distances in Java using DistanceUtil
        List<Object[]> withDistances = new ArrayList<>();
        for (Restaurant r : candidates) {
            Double rlat = r.getAddress() != null ? r.getAddress().getLatitude() : null;
            Double rlon = r.getAddress() != null ? r.getAddress().getLongitude() : null;
            if (rlat == null || rlon == null)
                continue;
            double d = DistanceUtil.haversine(lat, lon, rlat, rlon);
            withDistances.add(new Object[] { r, d });
        }

        // Sort
        if ("distance".equals(sort)) {
            withDistances.sort((a, b) -> Double.compare(((Number) a[1]).doubleValue(), ((Number) b[1]).doubleValue()));
        } else if ("rating".equals(sort)) {
            withDistances.sort((a, b) -> {
                Double ra = ((Restaurant) a[0]).getRating();
                Double rb = ((Restaurant) b[0]).getRating();
                return Double.compare(rb == null ? 0.0 : rb, ra == null ? 0.0 : ra);
            });
        } else {
            // default by rating desc
            withDistances.sort((a, b) -> {
                Double ra = ((Restaurant) a[0]).getRating();
                Double rb = ((Restaurant) b[0]).getRating();
                return Double.compare(rb == null ? 0.0 : rb, ra == null ? 0.0 : ra);
            });
        }

        // Page manually
        int total = withDistances.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<Object[]> pageContent = start >= total ? new ArrayList<>()
                : withDistances.subList(start, end);

        return new PageImpl<>(pageContent, pageable, total);
    }

    @Override
    public List<Restaurant> findRandomRestaurants(int limit) {
        // Use function('random') or function('rand') - fallback strategy
        // Try random() (Postgres), else rand() (MySQL). Use COALESCE by attempting one;
        // here we'll try random() and fall back in code if it fails.
        List<Restaurant> list = new ArrayList<>();
        try {
            Query q = em.createQuery("SELECT r FROM Restaurant r WHERE r.isActive = true ORDER BY function('random')");
            q.setMaxResults(limit);
            @SuppressWarnings("unchecked")
            List<Restaurant> result = q.getResultList();
            list.addAll(result);
        } catch (Exception ex) {
            Query q = em.createQuery("SELECT r FROM Restaurant r WHERE r.isActive = true ORDER BY function('rand')");
            q.setMaxResults(limit);
            @SuppressWarnings("unchecked")
            List<Restaurant> result = q.getResultList();
            list.addAll(result);
        }
        return list;
    }
}
