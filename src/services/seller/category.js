import request from '../request';
import requestWithoutTimeout from '../requestWithoutTimeout';

const sellerCategory = {
  getAll: (params) => request.get('dashboard/seller/categories', { params }),
  selectPaginate: (params) =>
    request.get('dashboard/seller/categories/select-paginate', { params }),
  selectMyCategoryPaginate: (params) =>
    request.get('dashboard/seller/my-categories/select-paginate', { params }),
  getById: (uuid, params) =>
    request.get(`dashboard/seller/categories/${uuid}`, { params }),
  delete: (params) =>
    request.delete(`dashboard/seller/categories/delete`, { params }),
  create: (data) => request.post('dashboard/seller/categories', data),
  update: (uuid, data) =>
    request.put(`dashboard/seller/categories/${uuid}`, data),
  search: (params) =>
    request.get('dashboard/seller/categories/search', { params }),
  select: (params) =>
    request.get('dashboard/seller/categories/select-paginate', { params }),
  setActive: (id) => request.post(`dashboard/seller/categories/${id}/active`),
  export: (params) =>
    requestWithoutTimeout.get('dashboard/seller/categories/export', { params }),
};

export default sellerCategory;
