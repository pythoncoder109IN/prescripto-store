export class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filterQuery = {};
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin|regex)\b/g, match => `$${match}`);
    
    const parsedQuery = JSON.parse(queryStr);
    
    // Handle special filters
    if (parsedQuery.price) {
      if (parsedQuery.price.$gte) parsedQuery.price.$gte = parseFloat(parsedQuery.price.$gte);
      if (parsedQuery.price.$lte) parsedQuery.price.$lte = parseFloat(parsedQuery.price.$lte);
    }

    if (parsedQuery.rating) {
      parsedQuery['rating.average'] = parsedQuery.rating;
      delete parsedQuery.rating;
    }

    // Text search
    if (this.queryString.search) {
      parsedQuery.$text = { $search: this.queryString.search };
    }

    this.filterQuery = parsedQuery;
    this.query = this.query.find(parsedQuery);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by creation date (newest first)
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Exclude sensitive fields by default
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 20;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    
    this.pagination = { page, limit, skip };
    return this;
  }

  getFilterQuery() {
    return this.filterQuery;
  }

  getPaginationInfo(total) {
    if (!this.pagination) return null;
    
    const { page, limit } = this.pagination;
    const pages = Math.ceil(total / limit);
    
    return {
      page,
      pages,
      limit,
      total,
      hasNext: page < pages,
      hasPrev: page > 1,
      nextPage: page < pages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };
  }
}