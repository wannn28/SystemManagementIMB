#!/bin/bash

# Script untuk generate implementasi pagination untuk entity baru
# Usage: ./generate_pagination.sh <entity_name> <entity_type>

ENTITY_NAME=$1
ENTITY_TYPE=$2

if [ -z "$ENTITY_NAME" ] || [ -z "$ENTITY_TYPE" ]; then
    echo "Usage: ./generate_pagination.sh <entity_name> <entity_type>"
    echo "Example: ./generate_pagination.sh finance Finance"
    exit 1
fi

# Convert to lowercase for file names
ENTITY_LOWER=$(echo $ENTITY_NAME | tr '[:upper:]' '[:lower:]')
ENTITY_UPPER=$(echo $ENTITY_TYPE | tr '[:lower:]' '[:upper:]')

echo "Generating pagination implementation for $ENTITY_TYPE..."

# 1. Update Repository Interface
echo "Updating repository interface..."
cat >> internal/repository/${ENTITY_LOWER}_repository.go << EOF

func (r *${ENTITY_LOWER}Repository) FindAllWithPagination(params response.QueryParams) ([]entity.${ENTITY_TYPE}, int, error) {
	var ${ENTITY_LOWER}s []entity.${ENTITY_TYPE}
	
	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.Build${ENTITY_TYPE}Query(params)
	
	total, err := queryBuilder.Paginate(query, params, &${ENTITY_LOWER}s)
	if err != nil {
		return nil, 0, err
	}
	
	return ${ENTITY_LOWER}s, total, nil
}
EOF

# 2. Update Service Interface
echo "Updating service interface..."
cat >> internal/service/${ENTITY_LOWER}_service.go << EOF

func (s *${ENTITY_LOWER}Service) GetAll${ENTITY_TYPE}sWithPagination(params response.QueryParams) ([]entity.${ENTITY_TYPE}, int, error) {
	return s.repo.FindAllWithPagination(params)
}
EOF

# 3. Update Handler
echo "Updating handler..."
cat >> internal/http/${ENTITY_LOWER}_handler.go << EOF

func (h *${ENTITY_TYPE}Handler) GetAll${ENTITY_TYPE}sWithPagination(c echo.Context) error {
	params := response.ParseQueryParams(c)
	${ENTITY_LOWER}s, total, err := h.service.GetAll${ENTITY_TYPE}sWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	
	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, ${ENTITY_LOWER}s, pagination)
}
EOF

# 4. Update Route
echo "Updating route..."
cat >> pkg/route/${ENTITY_LOWER}_route.go << EOF
	g.GET("/paginated", handler.GetAll${ENTITY_TYPE}sWithPagination)
EOF

echo "Pagination implementation for $ENTITY_TYPE has been generated!"
echo "Don't forget to:"
echo "1. Add the new method to the interface in repository"
echo "2. Add the new method to the interface in service"
echo "3. Add the new route to the route file"
echo "4. Test the implementation" 