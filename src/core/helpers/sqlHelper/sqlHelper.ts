export const addQueryFilterToSqlQuery = (
  entity_name: string,
  query_param: any,
  sql_query: any,
) => {
  let additional_filter = '',
    z = 0;

  for (const [key, value] of Object.entries(query_param)) {
    // 1. Check if the filter value is an array
    if (Array.isArray(value)) {
      const arr_parameter = 'val_arr' + z++;
      sql_query.andWhere(`${entity_name}.${key} IN (:${arr_parameter})`);
      sql_query.setParameter(arr_parameter, value);

      value.forEach((a) => {
        additional_filter = additional_filter.concat(`&${key}=${a}`);
      });
      continue;
    }

    if (key === 'tag' || key === 'tag_list') {
      if (Array.isArray(value)) {
        value.forEach((a) => {
          const tag_val_parameter = 'tag_val' + z++;
          sql_query.andWhere(
            `JSON_CONTAINS(${entity_name}.${key}, :${tag_val_parameter})`,
          );
          const new_value = `"${a}"`; // Mysql expects value to be enclosed in double quotes when searching in JSON Array
          sql_query.setParameter(tag_val_parameter, new_value);

          additional_filter = additional_filter.concat(`&${key}=${a}`);
        });
        continue;
      } else {
        const tag_val_parameter = 'tag_val' + z++;
        sql_query.andWhere(
          `JSON_CONTAINS(${entity_name}.${key}, :${tag_val_parameter})`,
        );
        const new_value = `"${value}"`; // Mysql expects value to be enclosed in double quotes when searching in JSON Array
        sql_query.setParameter(tag_val_parameter, new_value);

        additional_filter = additional_filter.concat(`&${key}=${value}`);
        continue;
      }
    }

    // 2. Check if the filter is a [page, limit] filter
    if (['page', 'limit'].indexOf(key) !== -1) {
      // ignore `query` and `limit` query params as they have already been considered above.
      continue;
    }

    // 3. Check if the filter value is a boolean[true, false] value
    if (['true', 'false'].includes(value.toString().toLowerCase())) {
      const bool_value = value.toString().toLowerCase() === 'true' ? 1 : 0;
      const bool_parameter = 'bool_val' + z++;
      sql_query.andWhere(`${entity_name}.${key} = :${bool_parameter}`);
      sql_query.setParameter(bool_parameter, bool_value);

      additional_filter = additional_filter.concat(`&${key}=${value}`);
      continue;
    }

    // 4. Check if the filter value is a epoch-time[start_at, end_at] filter
    // Todo: Check if the values are valid epoch time
    if (key === 'start_time' || key === 'end_time') {
      const epoch_time = new Date(+value * 1000);
      const sql_date_format = epoch_time
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      key === 'start_time'
        ? sql_query.andWhere(`${entity_name}.created_at >= :start_time`, {
            start_time: sql_date_format,
          })
        : sql_query.andWhere(`${entity_name}.created_at <= :end_time`, {
            end_time: sql_date_format,
          });
      additional_filter = additional_filter.concat(`&${key}=${value}`);
      continue;
    }

    // 5. Check if the filter value is a number
    if (!isNaN(+value)) {
      const num_parameter = 'num_val' + z++;
      sql_query.andWhere(`${entity_name}.${key} = :${num_parameter}`);
      sql_query.setParameter(num_parameter, +value);

      additional_filter = additional_filter.concat(`&${key}=${value}`);
      continue;
    }

    // 6. Finally, consider value as a string
    const str_parameter = 'str_val' + z++;
    sql_query.andWhere(`${entity_name}.${key} = :${str_parameter}`);
    sql_query.setParameter(str_parameter, value);

    additional_filter = additional_filter.concat(`&${key}=${value}`);
  }

  return {
    sql_query,
    additional_filter,
  };
};
