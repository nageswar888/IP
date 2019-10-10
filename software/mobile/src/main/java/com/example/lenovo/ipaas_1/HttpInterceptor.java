package com.example.lenovo.ipaas_1;

import org.apache.http.HttpException;
import org.apache.http.HttpRequest;
import org.apache.http.HttpRequestInterceptor;
import org.apache.http.protocol.HttpContext;

import java.io.IOException;

/**
 * Created by Arun on 11/28/2016.
 */


public class HttpInterceptor implements HttpRequestInterceptor
{

    /*@Inject
    public HttpInterceptor() {}

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request request = chain.request().newBuilder()
                .addHeader("Accept-Language", Locale.getDefault().getLanguage())
                .addHeader("Accept", RestApi.VERSION_HEADER + RestApi.API_VERSION)
                .build();
        return chain.proceed(request);
    }*/

    @Override
    public void process(HttpRequest httpRequest, HttpContext httpContext) throws HttpException, IOException
    {
        httpRequest.addHeader("Author", null);
    }
}